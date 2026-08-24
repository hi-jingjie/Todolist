const MAX_SOURCE_LENGTH = 5000

function buildIngestState(input) {
  const sourceText = String((input && input.sourceText) || '')
  const validTasks = (Array.isArray(input && input.validTasks) ? input.validTasks : [])
    .map((task) => ({
      ...task,
      dueText: task.dueAt || '原文未明确',
      estimateText: Number.isInteger(task.estimateMinutes)
        ? `${task.estimateMinutes} 分钟`
        : '待估',
      confidencePercent: Math.round(Number(task.confidence || 0) * 100),
      uncertaintyText: Array.isArray(task.uncertainties) ? task.uncertainties.join('；') : '',
    }))
  const invalidTasks = Array.isArray(input && input.invalidTasks) ? input.invalidTasks : []
  const loading = Boolean(input && input.loading)

  return {
    sourceText,
    sourceLength: sourceText.length,
    remainingCharacters: Math.max(0, MAX_SOURCE_LENGTH - sourceText.length),
    isTooLong: sourceText.length > MAX_SOURCE_LENGTH,
    validTasks,
    invalidTasks,
    loading,
    error: String((input && input.error) || ''),
    canExtract: Boolean(sourceText.trim()) && sourceText.length <= MAX_SOURCE_LENGTH && !loading,
    canConfirm: validTasks.length > 0 && !loading,
    invalidSummary: invalidTasks.length
      ? `${invalidTasks.length} 条结果未通过证据校验`
      : '',
  }
}

module.exports = {
  MAX_SOURCE_LENGTH,
  buildIngestState,
}
