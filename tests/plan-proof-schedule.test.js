const assert = require('assert')
const { buildDailyPlan } = require('../utils/plan-proof/schedule')
const { getCalibrationFactor } = require('../utils/plan-proof/calibration')

const plan = buildDailyPlan([
  {
    id: 'due',
    title: '今天交作业',
    dueDate: '2026-08-24',
    priority: 'high',
    estimateMinutes: 60,
  },
  {
    id: 'later',
    title: '整理笔记',
    dueDate: '2026-08-30',
    priority: 'low',
    estimateMinutes: 60,
  },
], {
  today: '2026-08-24',
  capacityMinutes: 60,
  calibrationFactor: 1,
})

assert.deepStrictEqual(plan.items.map((item) => item.id), ['due'], 'keeps the due-today task first')
assert.deepStrictEqual(plan.overflowIds, ['later'], 'marks eligible tasks that do not fit as overflow')
assert.strictEqual(plan.plannedMinutes, 60, 'totals planned minutes')
assert.strictEqual(plan.remainingMinutes, 0, 'reports unused capacity')

assert.strictEqual(
  getCalibrationFactor([
    { done: true, estimateMinutes: 30, actualMinutes: 45 },
  ]),
  1.5,
  'calibrates future estimates from completed tasks with real timings',
)

const priorityPlan = buildDailyPlan([
  {
    id: 'later-high',
    title: '下周高优任务',
    dueDate: '2026-08-30',
    priority: 'high',
    estimateMinutes: 60,
  },
  {
    id: 'overdue',
    title: '昨天到期任务',
    dueDate: '2026-08-23',
    priority: 'low',
    estimateMinutes: null,
  },
  {
    id: 'completed',
    title: '已完成任务',
    dueDate: '2026-08-20',
    priority: 'high',
    estimateMinutes: 10,
    done: true,
  },
], {
  today: '2026-08-24',
  capacityMinutes: 90,
  calibrationFactor: 1,
})

assert.deepStrictEqual(
  priorityPlan.items.map((item) => item.id),
  ['overdue', 'later-high'],
  'puts overdue work ahead of a later high-priority task and excludes completed work',
)
assert.strictEqual(priorityPlan.items[0].adjustedMinutes, 30, 'uses a thirty-minute default without an estimate')
assert.strictEqual(
  getCalibrationFactor([
    { done: true, estimateMinutes: 10, actualMinutes: 100 },
    { done: false, estimateMinutes: 10, actualMinutes: 1 },
  ]),
  2,
  'caps an extreme completed-task ratio and ignores unfinished work',
)
