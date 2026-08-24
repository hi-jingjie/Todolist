const assert = require('assert')

const store = {}
global.wx = {
  getStorageSync(key) {
    return store[key] === undefined ? '' : store[key]
  },
  setStorageSync(key, value) {
    store[key] = value
  },
}

const { toTodoPayload } = require('../utils/plan-proof/task-mapper')
const todo = require('../utils/todo')

const payload = toTodoPayload({
  title: '提交报名表',
  dueAt: '2026-09-01',
  priority: 'high',
  estimateMinutes: 30,
  evidenceQuote: '9月1日前提交报名表',
  confidence: 0.9,
  uncertainties: ['未说明提交平台'],
})

assert.strictEqual(payload.dueDate, '2026-09-01', 'maps the AI due date to a todo due date')
assert.strictEqual(payload.planProof.evidenceQuote, '9月1日前提交报名表', 'keeps the literal evidence')
assert.strictEqual(payload.estimateMinutes, 30, 'keeps the predicted effort')
assert.match(payload.note, /原文依据：9月1日前提交报名表/, 'makes the evidence visible in the todo note')
assert.match(payload.note, /未说明提交平台/, 'makes uncertainty visible for user review')
assert.strictEqual(typeof payload.planProof.importedAt, 'number', 'records when the AI draft was confirmed')

const addResult = todo.addTodo(payload)
assert.strictEqual(addResult.ok, true, 'adds a confirmed PlanProof draft')

const saved = todo.getTodos()[0]
assert.strictEqual(saved.estimateMinutes, 30, 'persists the estimate in local storage')
assert.deepStrictEqual(saved.planProof, payload.planProof, 'persists PlanProof metadata in local storage')

const actualResult = todo.recordActualMinutes(saved.id, 45)
assert.deepStrictEqual(actualResult, { ok: true }, 'records a positive actual duration')
assert.strictEqual(todo.getTodoById(saved.id).actualMinutes, 45, 'stores the actual duration')
assert.deepStrictEqual(
  todo.recordActualMinutes('missing-id', 45),
  { ok: false, message: '任务不存在' },
  'does not create an actual-duration record for an unknown todo',
)
assert.deepStrictEqual(
  todo.recordActualMinutes(saved.id, 0),
  { ok: false, message: '请输入大于 0 的分钟数' },
  'rejects a non-positive actual duration',
)
