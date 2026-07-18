const assert = require('assert')
const {
  createFocusState,
  formatSeconds,
  getRemainingSeconds,
  getStartSeconds,
} = require('../utils/focus-timer')

assert.strictEqual(formatSeconds(1500), '25:00', 'formats full minutes')
assert.strictEqual(formatSeconds(65), '01:05', 'pads minutes and seconds')
assert.strictEqual(formatSeconds(-3), '00:00', 'never formats negative time')

assert.deepStrictEqual(
  createFocusState(25),
  {
    durationMinutes: 25,
    totalSeconds: 1500,
    remainingSeconds: 1500,
    displayTime: '25:00',
    progress: 0,
    status: 'idle',
  },
  'creates the initial focus timer state'
)

assert.strictEqual(
  getRemainingSeconds(200000, 190400),
  10,
  'rounds remaining milliseconds up to the next second'
)

assert.strictEqual(
  getRemainingSeconds(200000, 201000),
  0,
  'does not return negative remaining seconds'
)

assert.strictEqual(
  getStartSeconds({ status: 'done', remainingSeconds: 0, totalSeconds: 1500 }),
  1500,
  'starts a completed timer again from the full duration'
)

assert.strictEqual(
  getStartSeconds({ status: 'paused', remainingSeconds: 600, totalSeconds: 1500 }),
  600,
  'continues a paused timer from its remaining seconds'
)
