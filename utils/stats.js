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

module.exports = {
  buildTodoStats,
}
