const assert = require('assert')
const {
  getPriorityMeta,
  sortTodosByPriority,
} = require('../utils/priority')

assert.deepStrictEqual(
  getPriorityMeta('high'),
  { id: 'high', text: '高', rank: 0 },
  'maps high priority to readable text'
)

assert.deepStrictEqual(
  getPriorityMeta('unknown'),
  { id: 'medium', text: '中', rank: 1 },
  'falls back to medium priority'
)

assert.deepStrictEqual(
  sortTodosByPriority([
    { id: 'low', priority: 'low' },
    { id: 'high', priority: 'high' },
    { id: 'medium', priority: 'medium' },
  ]).map((todo) => todo.id),
  ['high', 'medium', 'low'],
  'sorts priorities from high to low'
)
