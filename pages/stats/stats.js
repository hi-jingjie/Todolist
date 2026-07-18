const todo = require('../../utils/todo')
const { buildTodoStats } = require('../../utils/stats')

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
  },

  onShow() {
    const stats = buildTodoStats(todo.getTodos(), new Date())
    this.setData({
      stats,
      focusText: formatFocus(stats.focusMinutes),
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
