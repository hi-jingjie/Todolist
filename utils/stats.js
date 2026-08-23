const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(date) {
  const d = date instanceof Date ? date : new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function startOfWeek(date) {
  const d = startOfDay(date)
  const day = d.getDay()
  const offset = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - offset)
  return d
}

function isSameDay(time, today) {
  if (!time) {
    return false
  }
  const start = startOfDay(today).getTime()
  return time >= start && time < start + DAY_MS
}

function isThisWeek(time, today) {
  if (!time) {
    return false
  }
  const start = startOfWeek(today).getTime()
  return time >= start && time < start + 7 * DAY_MS
}

function parseDueDate(dueDate) {
  const match = String(dueDate || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) {
    return null
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

function isOverdue(todo, today) {
  if (todo.done) {
    return false
  }
  const due = parseDueDate(todo.dueDate)
  if (!due) {
    return false
  }
  return due.getTime() < startOfDay(today).getTime()
}

function buildTodoStats(todos, today) {
  const list = Array.isArray(todos) ? todos : []
  const current = today instanceof Date ? today : new Date()
  const focusSeconds = list.reduce(
    (sum, item) => sum + (Number(item.focusSeconds) || 0),
    0
  )
  return {
    todayCompleted: list.filter((item) => isSameDay(item.completedAt, current))
      .length,
    weekCompleted: list.filter((item) => isThisWeek(item.completedAt, current))
      .length,
    overdueCount: list.filter((item) => isOverdue(item, current)).length,
    focusSeconds,
    focusMinutes: Math.round(focusSeconds / 60),
    activeCount: list.filter((item) => !item.done).length,
    archivedCount: list.filter((item) => item.done).length,
    pinnedCount: list.filter((item) => item.pinned && !item.done).length,
  }
}

function buildHomeOverview(todos, today) {
  const current = today instanceof Date ? today : new Date()
  const stats = buildTodoStats(todos, current)
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return {
    dateText: `${current.getMonth() + 1}月${current.getDate()}日 ${weekdays[current.getDay()]}`,
    summaryText: `${stats.activeCount} 个未完成 · ${stats.overdueCount} 个已逾期 · 专注 ${stats.focusMinutes} 分钟`,
  }
}

function buildCompletionInsights(todos, categories, today) {
  const list = Array.isArray(todos) ? todos : []
  const current = startOfDay(today instanceof Date ? today : new Date())
  const trendCompleted = list.filter((item) => item.done && item.completedAt)
  const categoryCompleted = list.filter((item) => item.done)
  const dailyCounts = new Map()

  trendCompleted.forEach((item) => {
    const date = new Date(item.completedAt)
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    dailyCounts.set(key, (dailyCounts.get(key) || 0) + 1)
  })

  const weekTrend = []
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(current.getTime())
    date.setDate(date.getDate() - offset)
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    weekTrend.push({
      dateText: `${date.getMonth() + 1}/${date.getDate()}`,
      weekText: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
      count: dailyCounts.get(key) || 0,
    })
  }

  const maxCount = Math.max(0, ...weekTrend.map((item) => item.count))
  weekTrend.forEach((item) => {
    item.height = maxCount ? Math.round((item.count / maxCount) * 100) : 0
  })

  const names = new Map(
    (Array.isArray(categories) ? categories : []).map((item) => [
      item.id,
      item.name,
    ])
  )
  const categoryCounts = new Map()
  categoryCompleted.forEach((item) => {
    const id = item.category || 'other'
    categoryCounts.set(id, (categoryCounts.get(id) || 0) + 1)
  })
  const completedCount = categoryCompleted.length
  const categoryBreakdown = Array.from(categoryCounts.entries())
    .map(([id, count]) => ({
      id,
      name: names.get(id) || '其他',
      count,
      percent: completedCount ? Math.round((count / completedCount) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)

  return {
    weekTrend,
    categoryBreakdown,
  }
}

module.exports = {
  buildCompletionInsights,
  buildHomeOverview,
  buildTodoStats,
}
