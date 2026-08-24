const todo = require('../../utils/todo')
const { validateDraftResponse } = require('../../utils/plan-proof/draft')
const { toTodoPayload } = require('../../utils/plan-proof/task-mapper')
const { buildIngestState } = require('../../utils/plan-proof/ingest-state')

Page({
  data: buildIngestState({}),

  refresh(patch) {
    this.setData(buildIngestState({ ...this.data, ...(patch || {}) }))
  },

  onSourceInput(event) {
    this.refresh({
      sourceText: event.detail.value || '',
      validTasks: [],
      invalidTasks: [],
      error: '',
    })
  },

  async onExtract() {
    if (!this.data.canExtract) {
      return
    }
    if (!wx.cloud || !wx.cloud.callFunction) {
      this.refresh({ error: '云开发尚未初始化，请先在开发者工具中开通云开发' })
      return
    }

    const sourceText = this.data.sourceText
    this.refresh({ loading: true, error: '', validTasks: [], invalidTasks: [] })
    try {
      const callResult = await wx.cloud.callFunction({
        name: 'task-extractor',
        data: { text: sourceText },
      })
      const result = callResult && callResult.result
      if (!result || !result.ok) {
        this.refresh({ loading: false, error: (result && result.message) || '提取失败，请稍后重试' })
        return
      }

      const checked = validateDraftResponse(sourceText, result.response)
      this.refresh({
        loading: false,
        validTasks: checked.validTasks,
        invalidTasks: checked.invalidTasks,
      })
    } catch (error) {
      this.refresh({ loading: false, error: '提取失败，请检查网络后重试' })
    }
  },

  onConfirmTask(event) {
    const index = Number(event.currentTarget.dataset.index)
    const task = this.data.validTasks[index]
    if (!task) {
      return
    }

    const result = todo.addTodo(toTodoPayload(task))
    if (!result.ok) {
      wx.showToast({ title: result.message || '保存失败', icon: 'none' })
      return
    }

    const validTasks = this.data.validTasks.filter((_, itemIndex) => itemIndex !== index)
    this.refresh({ validTasks })
    wx.showToast({ title: '已添加到待办', icon: 'success' })
  },
})
