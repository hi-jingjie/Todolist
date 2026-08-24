const assert = require('assert')
const { buildPlanState } = require('../utils/plan-proof/plan-state')

const state = buildPlanState([
  {
    id: 'a',
    title: '提交报名表',
    dueDate: '2026-08-24',
    priority: 'high',
    estimateMinutes: 30,
  },
], {
  today: '2026-08-24',
  capacityMinutes: 60,
})

assert.strictEqual(state.plan.items[0].id, 'a', 'exposes the daily plan items')
assert.strictEqual(state.calibrationPercent, 100, 'uses a 100 percent factor without historical timings')
assert.strictEqual(state.overflowText, '', 'does not show overflow text when every task fits')

const overflowState = buildPlanState([
  { id: 'a', title: '任务 A', priority: 'high', estimateMinutes: 60 },
  { id: 'b', title: '任务 B', priority: 'medium', estimateMinutes: 60 },
], { today: '2026-08-24', capacityMinutes: 60 })
assert.strictEqual(overflowState.overflowText, '还有 1 个任务未排入今天', 'keeps overflow visible')
assert.deepStrictEqual(overflowState.overflowItems.map((item) => item.id), ['b'], 'exposes overflow task details')
