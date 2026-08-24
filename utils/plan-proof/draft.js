function validateDraftResponse(sourceText, response) {
  const tasks = Array.isArray(response && response.tasks) ? response.tasks : []
  const validTasks = []
  const invalidTasks = []

  tasks.forEach((task, index) => {
    const validation = validateTask(sourceText, task)
    if (validation.reason) {
      invalidTasks.push({ index, reason: validation.reason })
      return
    }

    validTasks.push(validation.task)
  })

  return {
    validTasks,
    invalidTasks,
  }
}

function validateTask(sourceText, task) {
  if (!task || typeof task !== 'object') {
    return { reason: 'invalid_title' }
  }

  const title = typeof task.title === 'string' ? task.title.trim() : ''
  if (!title) {
    return { reason: 'invalid_title' }
  }

  if (!isValidDueAt(task.dueAt)) {
    return { reason: 'invalid_due_at' }
  }

  if (!['low', 'medium', 'high'].includes(task.priority)) {
    return { reason: 'invalid_priority' }
  }

  if (task.estimateMinutes !== null
    && (!Number.isInteger(task.estimateMinutes) || task.estimateMinutes <= 0)) {
    return { reason: 'invalid_estimate' }
  }

  const evidenceQuote = typeof task.evidenceQuote === 'string' ? task.evidenceQuote : ''
  if (!evidenceQuote.trim() || !String(sourceText || '').includes(evidenceQuote)) {
    return { reason: 'invalid_evidence' }
  }

  if (typeof task.confidence !== 'number'
    || !Number.isFinite(task.confidence)
    || task.confidence < 0
    || task.confidence > 1) {
    return { reason: 'invalid_confidence' }
  }

  return {
    task: {
      title,
      dueAt: task.dueAt,
      priority: task.priority,
      estimateMinutes: task.estimateMinutes,
      evidenceQuote,
      confidence: task.confidence,
      uncertainties: Array.isArray(task.uncertainties)
        ? task.uncertainties.filter((item) => typeof item === 'string')
        : [],
    },
  }
}

function isValidDueAt(dueAt) {
  if (dueAt === null) {
    return true
  }

  if (typeof dueAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dueAt)) {
    return false
  }

  const [year, month, day] = dueAt.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
}

module.exports = {
  validateDraftResponse,
}
