function toTodoPayload(task) {
  const uncertainties = Array.isArray(task.uncertainties)
    ? task.uncertainties.filter((item) => typeof item === 'string' && item.trim())
    : []
  const evidenceQuote = String(task.evidenceQuote || '').trim()
  const noteLines = [`原文依据：${evidenceQuote}`]

  if (uncertainties.length > 0) {
    noteLines.push(`不确定项：${uncertainties.join('；')}`)
  }

  return {
    title: String(task.title || '').trim(),
    dueDate: task.dueAt || '',
    priority: task.priority,
    note: noteLines.join('\n'),
    estimateMinutes: task.estimateMinutes,
    planProof: {
      evidenceQuote,
      confidence: task.confidence,
      uncertainties,
      importedAt: Date.now(),
    },
  }
}

module.exports = {
  toTodoPayload,
}
