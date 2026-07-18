const assert = require('assert')
const { buildTodoListState } = require('../utils/todo-list-state')

const todos = [
  { id: '1', title: 'Buy milk', category: 'life', priority: 'low' },
  { id: '2', title: 'Work weekly report', category: 'work', priority: 'high' },
  { id: '3', title: 'Study Mini Program', category: 'study' },
]

const state = buildTodoListState(todos, {
  tab: 'work',
  keyword: 'weekly',
  statusFilter: 'all',
  today: new Date(2026, 6, 13),
})

assert.deepStrictEqual(
  state,
  {
    list: [
      {
        id: '2',
        title: 'Work weekly report',
        category: 'work',
        priority: 'high',
        priorityText: '高',
        dueText: '无截止日期',
        dueStatus: 'none',
        isOverdue: false,
      },
    ],
    swipeOpenId: '',
    overdueCount: 0,
    overdueText: '',
  },
  'builds the visible list state without needing a second update'
)

const priorityState = buildTodoListState([
  { id: 'low', title: 'Low task', category: 'work', priority: 'low' },
  { id: 'high', title: 'High task', category: 'work', priority: 'high' },
  { id: 'medium', title: 'Medium task', category: 'work', priority: 'medium' },
], {
  tab: 'work',
  keyword: '',
  statusFilter: 'all',
  priorityFilter: 'high',
  sortMode: 'priority',
  today: new Date(2026, 6, 13),
})

assert.deepStrictEqual(
  priorityState.list.map((todo) => todo.id),
  ['high'],
  'filters the visible list by priority'
)

const prioritySortedState = buildTodoListState([
  { id: 'low', title: 'Low task', category: 'work', priority: 'low' },
  { id: 'high', title: 'High task', category: 'work', priority: 'high' },
  { id: 'medium', title: 'Medium task', category: 'work', priority: 'medium' },
], {
  tab: 'work',
  keyword: '',
  statusFilter: 'all',
  priorityFilter: 'all',
  sortMode: 'priority',
  today: new Date(2026, 6, 13),
})

assert.deepStrictEqual(
  prioritySortedState.list.map((todo) => todo.id),
  ['high', 'medium', 'low'],
  'sorts the visible list by priority when requested'
)

const doneState = buildTodoListState([
  { id: 'active', title: 'Active task', category: 'work', done: false },
  { id: 'done', title: 'Done task', category: 'work', done: true },
], {
  tab: 'work',
  keyword: '',
  statusFilter: 'done',
  priorityFilter: 'all',
  sortMode: 'date',
  today: new Date(2026, 6, 13),
})

assert.deepStrictEqual(
  doneState.list.map((todo) => todo.id),
  ['done'],
  'filters the visible list by completion status'
)
