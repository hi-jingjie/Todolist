const assert = require('assert')
const { filterTodos } = require('../utils/todo-filter')

const todos = [
  { id: '1', title: 'Buy milk', category: 'life', done: false },
  { id: '2', title: 'Work weekly report', category: 'work', done: false },
  { id: '3', title: 'Study Mini Program', category: 'study', done: true },
  { id: '4', title: 'workout plan', category: 'life', done: true },
]

assert.deepStrictEqual(
  filterTodos(todos, { tab: 'all', keyword: 'work' }).map((t) => t.id),
  ['2', '4'],
  'searches titles regardless of case'
)

assert.deepStrictEqual(
  filterTodos(todos, { tab: 'life', keyword: 'work' }).map((t) => t.id),
  ['4'],
  'combines category filtering with title search'
)

assert.deepStrictEqual(
  filterTodos(todos, { tab: 'study', keyword: '  mini  ' }).map((t) => t.id),
  ['3'],
  'trims the search keyword'
)

assert.deepStrictEqual(
  filterTodos(todos, { tab: 'work', keyword: '' }).map((t) => t.id),
  ['2'],
  'keeps category filtering when the keyword is empty'
)

assert.deepStrictEqual(
  filterTodos(todos, { tab: 'all', keyword: '', statusFilter: 'active' }).map((t) => t.id),
  ['1', '2'],
  'filters unfinished todos'
)

assert.deepStrictEqual(
  filterTodos(todos, { tab: 'life', keyword: 'work', statusFilter: 'done' }).map((t) => t.id),
  ['4'],
  'combines status filtering with category and search'
)
