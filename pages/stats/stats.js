const todo = require('../../utils/todo')
const category = require('../../utils/category')
const { buildCompletionInsights, buildTodoStats } = require('../../utils/stats')

function formatFocus(minutes) {
  if (minutes < 60) {
    return `${minutes} 分钟`
  }
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} 小时 ${rest} 分钟` : `${hours} 小时`
}

Page({
  data: {
    stats: {
      todayCompleted: 0,
      weekCompleted: 0,
      overdueCount: 0,
      activeCount: 0,
      archivedCount: 0,
      pinnedCount: 0,
      focusMinutes: 0,
    },
    focusText: '0 分钟',
    weekTrend: [],
    categoryBreakdown: [],
    trendTotal: 0,
  },

  onShow() {
    const todos = todo.getTodos()
    const today = new Date()
    const stats = buildTodoStats(todos, today)
    const insights = buildCompletionInsights(
      todos,
      category.getCategories(),
      today
    )
    this.setData({
      stats,
      focusText: formatFocus(stats.focusMinutes),
      weekTrend: insights.weekTrend,
      trendTotal: insights.weekTrend.reduce((sum, item) => sum + item.count, 0),
      categoryBreakdown: insights.categoryBreakdown.map((item, index) => ({
        ...item,
        tone: index % 4,
      })),
    })
  },

  onNavTodo() {
    wx.redirectTo({
      url: '/pages/index/index',
    })
  },

  onNavArchive() {
    wx.redirectTo({
      url: '/pages/archive/archive',
    })
  },
})
