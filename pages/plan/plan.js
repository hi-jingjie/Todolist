const todo = require('../../utils/todo')
const { buildPlanState } = require('../../utils/plan-proof/plan-state')

const capacities = [60, 120, 180]

function todayText() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

Page({
  data: {
    capacities,
    capacityMinutes: 120,
    today: todayText(),
    plan: { items: [], overflowIds: [], plannedMinutes: 0, remainingMinutes: 120 },
    calibrationPercent: 100,
    overflowText: '',
    overflowItems: [],
  },

  onShow() {
    this.refresh()
  },

  refresh(patch) {
    const next = { ...this.data, ...(patch || {}) }
    const state = buildPlanState(todo.getTodos(), {
      today: next.today,
      capacityMinutes: next.capacityMinutes,
    })
    const todoById = new Map(todo.getTodos().map((item) => [item.id, item]))
    const previousInputs = new Map((this.data.plan.items || []).map((item) => [item.id, item.actualInput]))
    state.plan.items = state.plan.items.map((item) => {
      const saved = todoById.get(item.id)
      return {
        ...item,
        actualInput: previousInputs.has(item.id)
          ? previousInputs.get(item.id)
          : (saved && saved.actualMinutes ? String(saved.actualMinutes) : ''),
      }
    })
    this.setData({ ...next, ...state })
  },

  onCapacitySelect(event) {
    const capacityMinutes = Number(event.currentTarget.dataset.minutes)
    if (capacities.includes(capacityMinutes)) {
      this.refresh({ capacityMinutes })
    }
  },

  onActualInput(event) {
    const id = event.currentTarget.dataset.id
    const actualInput = event.detail.value
    const items = this.data.plan.items.map((item) => (
      item.id === id ? { ...item, actualInput } : item
    ))
    this.setData({ 'plan.items': items })
  },

  onSaveActualMinutes(event) {
    const id = event.currentTarget.dataset.id
    const item = this.data.plan.items.find((current) => current.id === id)
    if (!item) {
      return
    }
    const result = todo.recordActualMinutes(id, Number(item.actualInput))
    if (!result.ok) {
      wx.showToast({ title: result.message, icon: 'none' })
      return
    }
    wx.showToast({ title: '实际耗时已保存', icon: 'success' })
    this.refresh()
  },
})
