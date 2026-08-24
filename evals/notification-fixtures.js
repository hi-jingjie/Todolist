module.exports = [
  {
    id: 'explicit-deadline',
    sourceText: '请于2026年9月1日前提交创新创业比赛报名表。',
    modelResponse: {
      tasks: [{
        title: '提交创新创业比赛报名表',
        dueAt: '2026-09-01',
        priority: 'high',
        estimateMinutes: 30,
        evidenceQuote: '请于2026年9月1日前提交创新创业比赛报名表',
        confidence: 0.9,
        uncertainties: [],
      }],
    },
    validCount: 1,
    invalidCount: 0,
  },
  {
    id: 'unknown-deadline',
    sourceText: '本周完成实验室安全培训。',
    modelResponse: {
      tasks: [{
        title: '完成实验室安全培训',
        dueAt: null,
        priority: 'medium',
        estimateMinutes: 30,
        evidenceQuote: '完成实验室安全培训',
        confidence: 0.7,
        uncertainties: ['原文未提供明确截止日期'],
      }],
    },
    validCount: 1,
    invalidCount: 0,
  },
  {
    id: 'multiple-tasks',
    sourceText: '请在2026年8月24日完成课程选课确认，并于2026年8月30日前提交社团报名表。',
    modelResponse: {
      tasks: [
        {
          title: '完成课程选课确认',
          dueAt: '2026-08-24',
          priority: 'high',
          estimateMinutes: 30,
          evidenceQuote: '请在2026年8月24日完成课程选课确认',
          confidence: 0.9,
          uncertainties: [],
        },
        {
          title: '提交社团报名表',
          dueAt: '2026-08-30',
          priority: 'medium',
          estimateMinutes: 30,
          evidenceQuote: '于2026年8月30日前提交社团报名表',
          confidence: 0.9,
          uncertainties: [],
        },
      ],
    },
    validCount: 2,
    invalidCount: 0,
  },
  {
    id: 'invented-evidence',
    sourceText: '请阅读开学通知。',
    modelResponse: {
      tasks: [{
        title: '提交奖学金申请',
        dueAt: '2026-09-01',
        priority: 'high',
        estimateMinutes: 30,
        evidenceQuote: '9月1日前提交奖学金申请',
        confidence: 0.8,
        uncertainties: [],
      }],
    },
    validCount: 0,
    invalidCount: 1,
  },
]
