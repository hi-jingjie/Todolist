const DAY_MS = 24 * 60 * 60 * 1000

function parseDueDate(dueDate) {
  const match = String(dueDate || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) {
    return null
  }
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  return new Date(year, month - 1, day)
}

function startOfDay(date) {
  const d = date instanceof Date ? date : new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function formatMonthDay(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

function getDueMeta(dueDate, today) {
  const parsed = parseDueDate(dueDate)
  if (!parsed) {
    return {
      text: '无截止日期',
      status: 'none',
      isOverdue: false,
      sortValue: Infinity,
    }
  }

  const current = startOfDay(today)
  const diffDays = Math.round((parsed.getTime() - current.getTime()) / DAY_MS)
  const sortValue = parsed.getTime()

  if (diffDays < 0) {
    return {
      text: `已逾期 · ${formatMonthDay(parsed)}`,
      status: 'overdue',
      isOverdue: true,
      sortValue,
    }
  }
  if (diffDays === 0) {
    return {
      text: '今天',
      status: 'today',
      isOverdue: false,
      sortValue,
    }
  }
  if (diffDays === 1) {
    return {
      text: '明天',
      status: 'tomorrow',
      isOverdue: false,
      sortValue,
    }
  }
  return {
    text: formatMonthDay(parsed),
    status: 'future',
    isOverdue: false,
    sortValue,
  }
}

function sortTodosByDueDate(todos, today) {
  return todos
    .map((todo, index) => ({
      todo,
      index,
      due: getDueMeta(todo.dueDate, today),
    }))
    .sort((a, b) => {
      if (a.due.sortValue !== b.due.sortValue) {
        return a.due.sortValue - b.due.sortValue
      }
      return a.index - b.index
    })
    .map((item) => item.todo)
}

module.exports = {
  getDueMeta,
  sortTodosByDueDate,
}
