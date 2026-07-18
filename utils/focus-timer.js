function pad2(value) {
  return String(value).padStart(2, '0')
}

function formatSeconds(seconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0))
  const minutes = Math.floor(safeSeconds / 60)
  const rest = safeSeconds % 60
  return `${pad2(minutes)}:${pad2(rest)}`
}

function createFocusState(durationMinutes) {
  const minutes = Number(durationMinutes) || 25
  const totalSeconds = minutes * 60
  return {
    durationMinutes: minutes,
    totalSeconds,
    remainingSeconds: totalSeconds,
    displayTime: formatSeconds(totalSeconds),
    progress: 0,
    status: 'idle',
  }
}

function getRemainingSeconds(endAt, now) {
  const remainingMs = Number(endAt) - Number(now)
  return Math.max(0, Math.ceil(remainingMs / 1000))
}

function getProgress(totalSeconds, remainingSeconds) {
  if (!totalSeconds) {
    return 0
  }
  const done = totalSeconds - remainingSeconds
  return Math.min(100, Math.max(0, Math.round((done / totalSeconds) * 100)))
}

function getStartSeconds(state) {
  if (!state || state.status === 'done' || state.remainingSeconds <= 0) {
    return state && state.totalSeconds ? state.totalSeconds : 0
  }
  return state.remainingSeconds
}

module.exports = {
  createFocusState,
  formatSeconds,
  getProgress,
  getRemainingSeconds,
  getStartSeconds,
}
