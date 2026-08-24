const PRIORITY_ORDER = {
  high: 0,
  medium: 1,
  low: 2,
}

function buildDailyPlan(todos, options) {
  const settings = options || {}
  const today = settings.today
  const capacityMinutes = positiveIntegerOr(settings.capacityMinutes, 120)
  const calibrationFactor = positiveNumberOr(settings.calibrationFactor, 1)
  const eligible = (Array.isArray(todos) ? todos : [])
    .filter((todo) => todo && !todo.done)
    .map((todo, index) => ({ todo, index }))
    .sort((left, right) => compareTodos(left, right, today))

  let plannedMinutes = 0
  const items = []
  const overflowIds = []

  eligible.forEach(({ todo }) => {
    const adjustedMinutes = Math.ceil(getEstimateMinutes(todo) * calibrationFactor)
    if (plannedMinutes + adjustedMinutes > capacityMinutes) {
      overflowIds.push(todo.id)
      return
    }

    plannedMinutes += adjustedMinutes
    items.push({
      id: todo.id,
      title: todo.title,
      adjustedMinutes,
      dueDate: todo.dueDate || '',
      priority: todo.priority || 'medium',
    })
  })

  return {
    items,
    overflowIds,
    plannedMinutes,
    remainingMinutes: capacityMinutes - plannedMinutes,
  }
}

function compareTodos(left, right, today) {
  const leftOverdue = isOverdue(left.todo.dueDate, today)
  const rightOverdue = isOverdue(right.todo.dueDate, today)
  if (leftOverdue !== rightOverdue) {
    return leftOverdue ? -1 : 1
  }

  const dueCompare = compareDueDates(left.todo.dueDate, right.todo.dueDate)
  if (dueCompare !== 0) {
    return dueCompare
  }

  const priorityCompare = priorityOrder(left.todo.priority) - priorityOrder(right.todo.priority)
  if (priorityCompare !== 0) {
    return priorityCompare
  }

  return left.index - right.index
}

function isOverdue(dueDate, today) {
  return Boolean(today && isDateText(dueDate) && dueDate < today)
}

function compareDueDates(left, right) {
  const leftDate = isDateText(left) ? left : null
  const rightDate = isDateText(right) ? right : null
  if (leftDate && rightDate) return leftDate.localeCompare(rightDate)
  if (leftDate) return -1
  if (rightDate) return 1
  return 0
}

function isDateText(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function priorityOrder(priority) {
  return PRIORITY_ORDER[priority] === undefined ? PRIORITY_ORDER.medium : PRIORITY_ORDER[priority]
}

function getEstimateMinutes(todo) {
  return positiveIntegerOr(todo.estimateMinutes, 30)
}

function positiveIntegerOr(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback
}

function positiveNumberOr(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback
}

module.exports = {
  buildDailyPlan,
}
