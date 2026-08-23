const assert = require('assert')

const store = {}
Date.now = () => new Date(2026, 6, 18, 10, 0, 0).getTime()

global.wx = {
  getStorageSync(key) {
    return store[key] === undefined ? '' : store[key]
  },
  setStorageSync(key, value) {
    store[key] = value
  },
}

const todo = require('../utils/todo')
const { buildTodoListState } = require('../utils/todo-list-state')
const { buildHomeOverview, buildTodoStats } = require('../utils/stats')

todo.addTodo({
  title: '普通任务',
  category: 'work',
  priority: 'low',
  dueDate: '2026-07-20',
})
todo.addTodo({
  title: '置顶任务',
  category: 'work',
  priority: 'low',
  dueDate: '2026-07-25',
})
todo.addTodo({
  title: '已完成任务',
  category: 'work',
  priority: 'medium',
  dueDate: '2026-07-18',
})

const todos = todo.getTodos()
const pinned = todos.find((item) => item.title === '置顶任务')
const done = todos.find((item) => item.title === '已完成任务')

todo.togglePin(pinned.id)
todo.completeFocus(done.id, 1500)

const listState = buildTodoListState(todo.getTodos(), {
  tab: 'all',
  keyword: '',
  statusFilter: 'all',
  priorityFilter: 'all',
  sortMode: 'date',
  today: new Date(2026, 6, 18),
})

assert.deepStrictEqual(
  listState.list.map((item) => item.title),
  ['置顶任务', '普通任务'],
  'default home list hides completed items and puts pinned items first'
)
assert.strictEqual(listState.list[0].pinned, true, 'exposes pinned state')

const archivedState = buildTodoListState(todo.getTodos(), {
  tab: 'all',
  keyword: '',
  statusFilter: 'done',
  priorityFilter: 'all',
  sortMode: 'date',
  today: new Date(2026, 6, 18),
})

assert.deepStrictEqual(
  archivedState.list.map((item) => item.title),
  ['已完成任务'],
  'done filter can still read archived completed items'
)

const stats = buildTodoStats(todo.getTodos(), new Date(2026, 6, 18))

assert.strictEqual(stats.todayCompleted, 1, 'counts completed tasks today')
assert.strictEqual(stats.weekCompleted, 1, 'counts completed tasks this week')
assert.strictEqual(stats.archivedCount, 1, 'counts archived tasks')
assert.strictEqual(stats.activeCount, 2, 'counts active tasks')
assert.strictEqual(stats.focusMinutes, 25, 'sums focus minutes')

const overview = buildHomeOverview(todo.getTodos(), new Date(2026, 6, 18))

assert.strictEqual(overview.dateText, '7月18日 星期六', 'formats home date')
assert.strictEqual(
  overview.summaryText,
  '2 个未完成 · 0 个已逾期 · 专注 25 分钟',
  'builds the compact home summary'
)

todo.updateTodo(done.id, { done: false })
const restoredStats = buildTodoStats(todo.getTodos(), new Date(2026, 6, 18))

assert.strictEqual(restoredStats.archivedCount, 0, 'restored tasks leave archive')
assert.strictEqual(
  restoredStats.todayCompleted,
  0,
  'restored tasks no longer count as completed today'
)
