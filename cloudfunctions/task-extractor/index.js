const https = require('https')
const http = require('http')
const { isTaskResponse } = require('./validate')

const MAX_TEXT_LENGTH = 5000

function createMain({ requestModel }) {
  return async function main(event) {
    const text = typeof (event && event.text) === 'string' ? event.text.trim() : ''
    if (!text || text.length > MAX_TEXT_LENGTH) {
      return {
        ok: false,
        code: 'invalid_input',
        message: '请输入 1 到 5000 个字符的任务文本',
      }
    }

    try {
      const response = await requestModel({ text })
      if (!isTaskResponse(response)) {
        return {
          ok: false,
          code: 'invalid_model_response',
          message: '模型返回格式不正确，请重试',
        }
      }
      return { ok: true, response }
    } catch (error) {
      return {
        ok: false,
        code: 'model_failure',
        message: '模型服务暂时不可用，请稍后重试',
      }
    }
  }
}

function createRemoteProvider(env) {
  const apiUrl = env.MODEL_API_URL
  const apiKey = env.MODEL_API_KEY
  const model = env.MODEL_NAME

  return async function requestModel({ text }) {
    if (!apiUrl || !apiKey || !model) {
      throw new Error('model provider is not configured')
    }

    const response = await requestJson(apiUrl, apiKey, {
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: '你是任务草稿提取器。仅返回 JSON 对象 {"tasks":[]}。每个任务必须包含 title、dueAt(YYYY-MM-DD 或 null)、priority(low|medium|high)、estimateMinutes(正整数或 null)、evidenceQuote、confidence(0 到 1)、uncertainties(字符串数组)。evidenceQuote 必须逐字引用用户原文；原文未明确的信息设为 null 或写入 uncertainties。不要编造。',
        },
        { role: 'user', content: text },
      ],
    })

    const content = response
      && response.choices
      && response.choices[0]
      && response.choices[0].message
      && response.choices[0].message.content
    if (typeof content !== 'string') {
      throw new Error('missing model content')
    }

    return JSON.parse(content)
  }
}

function requestJson(urlText, apiKey, payload) {
  const url = new URL(urlText)
  const body = JSON.stringify(payload)
  const client = url.protocol === 'http:' ? http : https

  return new Promise((resolve, reject) => {
    const request = client.request({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || undefined,
      path: `${url.pathname}${url.search}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 15000,
    }, (response) => {
      let data = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => { data += chunk })
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`model request failed with status ${response.statusCode}`))
          return
        }
        try {
          resolve(JSON.parse(data))
        } catch (error) {
          reject(error)
        }
      })
    })
    request.on('timeout', () => request.destroy(new Error('model request timed out')))
    request.on('error', reject)
    request.write(body)
    request.end()
  })
}

const main = createMain({ requestModel: createRemoteProvider(process.env) })

module.exports = {
  createMain,
  main,
}
