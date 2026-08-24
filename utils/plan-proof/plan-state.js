const { getCalibrationFactor } = require('./calibration')
const { buildDailyPlan } = require('./schedule')

function buildPlanState(todos, options) {
  const allTodos = Array.isArray(todos) ? todos : []
  const settings = options || {}
  const calibrationFactor = getCalibrationFactor(allTodos)
  const plan = buildDailyPlan(allTodos, {
    ...settings,
    calibrationFactor,
  })
  const todoById = new Map(allTodos.map((todo) => [todo.id, todo]))
  const overflowItems = plan.overflowIds
    .map((id) => todoById.get(id))
    .filter(Boolean)
    .map((todo) => ({
      id: todo.id,
      title: todo.title,
      dueDate: todo.dueDate || '',
      priority: todo.priority || 'medium',
    }))

  return {
    plan,
    calibrationPercent: Math.round(calibrationFactor * 100),
    overflowText: overflowItems.length ? `还有 ${overflowItems.length} 个任务未排入今天` : '',
    overflowItems,
  }
}

module.exports = {
  buildPlanState,
}
