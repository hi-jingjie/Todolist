function getCalibrationFactor(todos) {
  const ratios = (Array.isArray(todos) ? todos : [])
    .filter((todo) => todo && todo.done === true)
    .filter((todo) => isPositiveInteger(todo.estimateMinutes) && isPositiveInteger(todo.actualMinutes))
    .map((todo) => todo.actualMinutes / todo.estimateMinutes)

  if (ratios.length === 0) {
    return 1
  }

  const average = ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length
  return Math.min(2, Math.max(0.5, average))
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0
}

module.exports = {
  getCalibrationFactor,
}
