const assert = require('assert')
const {
  getDueMeta,
  sortTodosByDueDate,
} = require('../utils/due-date')

const today = new Date(2026, 6, 13)

assert.deepStrictEqual(
  getDueMeta('', today),
  { text: '无截止日期', status: 'none', isOverdue: false, sortValue: Infinity },
  'empty due dates are shown as no due date'
)

assert.deepStrictEqual(
  getDueMeta('2026-07-12', today),
  { text: '已逾期 · 07-12', status: 'overdue', isOverdue: true, sortValue: 1783785600000 },
  'past due dates are marked overdue'
)

assert.deepStrictEqual(
  getDueMeta('2026-07-13', today),
  { text: '今天', status: 'today', isOverdue: false, sortValue: 1783872000000 },
  'today due dates are highlighted'
)

assert.deepStrictEqual(
  getDueMeta('2026-07-14', today),
  { text: '明天', status: 'tomorrow', isOverdue: false, sortValue: 1783958400000 },
  'tomorrow due dates are highlighted'
)

assert.deepStrictEqual(
  sortTodosByDueDate([
    { id: 'none', dueDate: '', createdAt: 4 },
    { id: 'tomorrow', dueDate: '2026-07-14', createdAt: 3 },
    { id: 'overdue', dueDate: '2026-07-12', createdAt: 2 },
    { id: 'today', dueDate: '2026-07-13', createdAt: 1 },
  ], today).map((todo) => todo.id),
  ['overdue', 'today', 'tomorrow', 'none'],
  'sorts dated todos first from nearest to farthest'
)
