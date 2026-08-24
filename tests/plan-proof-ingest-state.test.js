const assert = require('assert')
const { buildIngestState } = require('../utils/plan-proof/ingest-state')

const state = buildIngestState({
  sourceText: '请提交报名表。',
  validTasks: [{ title: '提交报名表', evidenceQuote: '提交报名表', uncertainties: [] }],
  invalidTasks: [{ index: 1, reason: 'invalid_evidence' }],
  loading: false,
  error: '',
})

assert.strictEqual(state.canExtract, true, 'enables extraction when there is text to inspect')
assert.strictEqual(state.canConfirm, true, 'enables confirmation when a locally grounded task exists')
assert.strictEqual(state.invalidSummary, '1 条结果未通过证据校验', 'explains why invalid drafts cannot be confirmed')
assert.strictEqual(state.remainingCharacters, 4993, 'shows source-text capacity before submitting')

const emptyState = buildIngestState({ sourceText: '   ', validTasks: [], invalidTasks: [] })
assert.strictEqual(emptyState.canExtract, false, 'disables extraction without meaningful text')
assert.strictEqual(emptyState.canConfirm, false, 'does not enable confirmation without valid drafts')
