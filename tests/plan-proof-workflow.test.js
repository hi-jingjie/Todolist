const assert = require('assert')
const fixtures = require('../evals/notification-fixtures')
const { validateDraftResponse } = require('../utils/plan-proof/draft')
const { toTodoPayload } = require('../utils/plan-proof/task-mapper')
const { buildDailyPlan } = require('../utils/plan-proof/schedule')

const store = {}
global.wx = {
  getStorageSync(key) {
    return store[key] === undefined ? '' : store[key]
  },
  setStorageSync(key, value) {
    store[key] = value
  },
}
const todo = require('../utils/todo')

fixtures.forEach((fixture) => {
  const result = validateDraftResponse(fixture.sourceText, fixture.modelResponse)
  assert.strictEqual(result.validTasks.length, fixture.validCount, `${fixture.id} has expected valid drafts`)
  assert.strictEqual(result.invalidTasks.length, fixture.invalidCount, `${fixture.id} has expected rejected drafts`)
})

const multiple = fixtures.find((item) => item.id === 'multiple-tasks')
const checked = validateDraftResponse(multiple.sourceText, multiple.modelResponse)
checked.validTasks.forEach((task) => {
  const result = todo.addTodo(toTodoPayload(task))
  assert.strictEqual(result.ok, true, 'persists every user-confirmed grounded draft')
})

const plan = buildDailyPlan(todo.getTodos(), {
  today: '2026-08-24',
  capacityMinutes: 45,
  calibrationFactor: 1,
})
assert.strictEqual(plan.items.length, 1, 'turns persisted confirmed tasks into a capacity-limited daily plan')
assert.strictEqual(plan.overflowIds.length, 1, 'keeps the second task visible as overflow')
