function isTaskResponse(value) {
  return Boolean(value) && typeof value === 'object' && Array.isArray(value.tasks)
}

module.exports = {
  isTaskResponse,
}
