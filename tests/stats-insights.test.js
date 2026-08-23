const assert = require('assert')

const { buildCompletionInsights } = require('../utils/stats')

const today = new Date(2026, 6, 18, 12, 0, 0)
const atNoon = (year, month, day) =>
  new Date(year, month - 1, day, 12, 0, 0).getTime()

const todos = [
  {
    title: '整理文档',
    category: 'work',
    done: true,
    completedAt: atNoon(2026, 7, 12),
  },
  {
    title: '提交周报',
    category: 'work',
    done: true,
    completedAt: atNoon(2026, 7, 18),
  },
  {
    title: '完成阅读',
    category: 'study',
    done: true,
    completedAt: atNoon(2026, 7, 18),
  },
  {
    title: '还没完成',
    category: 'study',
    done: false,
    completedAt: atNoon(2026, 7, 18),
  },
  {
    title: '旧版完成任务',
    category: 'life',
    done: true,
  },
]

const insights = buildCompletionInsights(
  todos,
  [
    { id: 'work', name: '工作' },
    { id: 'study', name: '学习' },
    { id: 'life', name: '生活' },
  ],
  today
)

assert.deepStrictEqual(
  insights.weekTrend.map((item) => item.count),
  [1, 0, 0, 0, 0, 0, 2],
  'builds a seven-day completed-task trend ending today'
)
assert.deepStrictEqual(
  insights.weekTrend.map((item) => item.height),
  [50, 0, 0, 0, 0, 0, 100],
  'scales trend bars against the busiest day'
)
assert.deepStrictEqual(
  insights.categoryBreakdown,
  [
    { id: 'work', name: '工作', count: 2, percent: 50 },
    { id: 'study', name: '学习', count: 1, percent: 25 },
    { id: 'life', name: '生活', count: 1, percent: 25 },
  ],
  'groups all completed tasks by category, including legacy records without completion time'
)
