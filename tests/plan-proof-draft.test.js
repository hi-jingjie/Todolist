const assert = require('assert')
const { validateDraftResponse } = require('../utils/plan-proof/draft')

const source = '请于2026年9月1日前提交创新创业比赛报名表。'
const result = validateDraftResponse(source, {
  tasks: [
    {
      title: '提交创新创业比赛报名表',
      dueAt: '2026-09-01',
      priority: 'high',
      estimateMinutes: 30,
      evidenceQuote: '请于2026年9月1日前提交创新创业比赛报名表',
      confidence: 0.9,
      uncertainties: [],
    },
  ],
})

assert.strictEqual(
  result.validTasks.length,
  1,
  'accepts a complete draft whose evidence is copied from the source text'
)
assert.strictEqual(
  result.invalidTasks.length,
  0,
  'does not reject a grounded and well-formed draft'
)

const rejectionResult = validateDraftResponse(source, {
  tasks: [
    {
      title: '虚构任务',
      dueAt: '2026-09-01',
      priority: 'high',
      estimateMinutes: 30,
      evidenceQuote: '明天完成虚构任务',
      confidence: 0.9,
      uncertainties: [],
    },
    {
      title: '提交报名表',
      dueAt: '2026-09-01',
      priority: 'urgent',
      estimateMinutes: 30,
      evidenceQuote: '提交创新创业比赛报名表',
      confidence: 0.9,
      uncertainties: [],
    },
    {
      title: '提交创新创业比赛报名表',
      dueAt: null,
      priority: 'medium',
      estimateMinutes: null,
      evidenceQuote: '提交创新创业比赛报名表',
      confidence: 0.5,
      uncertainties: ['通知未提供截止日期'],
    },
  ],
})

assert.strictEqual(
  rejectionResult.validTasks.length,
  1,
  'keeps a grounded draft when its unknown date is explicitly null'
)
assert.deepStrictEqual(
  rejectionResult.invalidTasks,
  [
    { index: 0, reason: 'invalid_evidence' },
    { index: 1, reason: 'invalid_priority' },
  ],
  'rejects invented evidence and unsupported priorities before the draft reaches the UI'
)

const malformedResult = validateDraftResponse(source, {
  tasks: [
    {
      title: '   ',
      dueAt: '2026-09-01',
      priority: 'medium',
      estimateMinutes: 30,
      evidenceQuote: '提交创新创业比赛报名表',
      confidence: 0.8,
      uncertainties: [],
    },
    {
      title: '提交报名表',
      dueAt: '2026-02-30',
      priority: 'medium',
      estimateMinutes: 30,
      evidenceQuote: '提交创新创业比赛报名表',
      confidence: 0.8,
      uncertainties: [],
    },
    {
      title: '提交报名表',
      dueAt: '2026-09-01',
      priority: 'medium',
      estimateMinutes: 0,
      evidenceQuote: '提交创新创业比赛报名表',
      confidence: 0.8,
      uncertainties: [],
    },
    {
      title: '提交报名表',
      dueAt: '2026-09-01',
      priority: 'medium',
      estimateMinutes: 30,
      evidenceQuote: '提交创新创业比赛报名表',
      confidence: 1.1,
      uncertainties: [],
    },
  ],
})

assert.deepStrictEqual(
  malformedResult.invalidTasks,
  [
    { index: 0, reason: 'invalid_title' },
    { index: 1, reason: 'invalid_due_at' },
    { index: 2, reason: 'invalid_estimate' },
    { index: 3, reason: 'invalid_confidence' },
  ],
  'rejects malformed fields before they can reach the confirmation screen'
)
