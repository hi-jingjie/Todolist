const assert = require('assert')
const { createMain } = require('../cloudfunctions/task-extractor')

async function run() {
  const main = createMain({
    requestModel: async () => ({ tasks: [{ title: '提交报名表' }] }),
  })

  const success = await main({ text: '请提交报名表。' })
  assert.strictEqual(success.ok, true, 'returns a valid provider response')
  assert.strictEqual(success.response.tasks[0].title, '提交报名表', 'keeps the provider draft intact')

  const blank = await main({ text: '   ' })
  assert.strictEqual(blank.code, 'invalid_input', 'rejects blank source text before calling a model')

  const tooLong = await main({ text: 'a'.repeat(5001) })
  assert.strictEqual(tooLong.code, 'invalid_input', 'limits source text to the UI contract')

  const failedProvider = createMain({
    requestModel: async () => {
      throw new Error('provider token should never reach the user')
    },
  })
  const failed = await failedProvider({ text: '请提交报名表。' })
  assert.deepStrictEqual(
    failed,
    { ok: false, code: 'model_failure', message: '模型服务暂时不可用，请稍后重试' },
    'normalizes provider errors without leaking implementation details',
  )

  const malformedProvider = createMain({ requestModel: async () => 'not-an-object' })
  const malformed = await malformedProvider({ text: '请提交报名表。' })
  assert.strictEqual(malformed.code, 'invalid_model_response', 'rejects an unexpected model response shape')
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
