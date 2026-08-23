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

const todo = require('../utils/todo')

const noteResult = todo.addTodo({
  title: '写论文',
  category: 'study',
  priority: 'high',
  dueDate: '2026-07-18',
  note: '先整理参考文献',
  repeat: 'daily',
})
assert.strictEqual(noteResult.ok, true, 'adds todo with note and repeat')

let first = todo.getTodos()[0]
assert.strictEqual(first.note, '先整理参考文献', 'stores todo note')
assert.strictEqual(first.repeat, 'daily', 'stores repeat rule')

const repeatedCompletion = todo.completeTodo(first.id)
assert.strictEqual(
  repeatedCompletion.createdNext,
  true,
  'reports when completion creates the next repeated todo'
)
const afterComplete = todo.getTodos()
const completed = afterComplete.find((item) => item.id === first.id)
const nextDaily = afterComplete.find((item) => item.id !== first.id)

assert.strictEqual(completed.done, true, 'marks repeated todo complete')
assert.strictEqual(nextDaily.done, false, 'creates an unfinished next repeat todo')
assert.strictEqual(nextDaily.dueDate, '2026-07-19', 'moves daily repeat by one day')
assert.strictEqual(nextDaily.repeat, 'daily', 'keeps repeat rule on next todo')
assert.strictEqual(nextDaily.note, '先整理参考文献', 'copies note to next repeat todo')

todo.markTodosDone([nextDaily.id])
assert.strictEqual(
  todo.getTodoById(nextDaily.id).done,
  true,
  'batch marks selected todos done'
)

todo.addTodo({ title: '临时任务', category: 'work', priority: 'low' })
const temp = todo.getTodos()[0]
todo.deleteTodos([temp.id])
assert.strictEqual(todo.getTodoById(temp.id), null, 'batch deletes selected todos')

todo.clearDoneTodos()
assert.deepStrictEqual(
  todo.getTodos().filter((item) => item.done),
  [],
  'clears completed todos'
)

const focusResult = todo.addTodo({
  title: '专注阅读',
  category: 'study',
  priority: 'medium',
})
assert.strictEqual(focusResult.ok, true)
const focusTodo = todo.getTodos()[0]
todo.completeFocus(focusTodo.id, 1500)
const focused = todo.getTodoById(focusTodo.id)

assert.strictEqual(focused.done, true, 'focus completion marks todo done')
assert.strictEqual(focused.focusSeconds, 1500, 'records focus seconds')
assert.strictEqual(focused.focusCount, 1, 'records focus count')

todo.addTodo({ title: '一次性任务', category: 'life', priority: 'low' })
const oneTimeTodo = todo.getTodos()[0]
const oneTimeCompletion = todo.completeTodo(oneTimeTodo.id)
assert.strictEqual(
  oneTimeCompletion.createdNext,
  false,
  'reports when completion does not create another todo'
)
