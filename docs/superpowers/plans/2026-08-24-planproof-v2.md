# PlanProof V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a text-first, evidence-driven AI task import and calibrated daily-planning flow to the existing WeChat Mini Program.

**Architecture:** The mini program remains the source of truth for confirmed tasks and completion data. A stateless CloudBase function converts pasted text into draft tasks; local pure functions validate evidence, map confirmed drafts into todos, build a capacity-limited day plan, and calculate an estimate calibration factor. The user confirms every model suggestion before it is persisted.

**Tech Stack:** WeChat Mini Program native JavaScript/WXML/WXSS, Node.js built-in `assert` tests, CloudBase Node.js cloud function, OpenAI-compatible LLM HTTP endpoint, CloudBase Secrets.

**Spec:** `docs/superpowers/specs/2026-08-24-planproof-v2-design.md`

## Global Constraints

- V2 accepts pasted text only; do not add OCR, PDF parsing, account sync, automation, or multi-agent behavior.
- Confirmed task data remains in `wx` local storage; the cloud function is stateless and stores no request data.
- The model may only propose drafts. It must never create, update, complete, or delete local tasks directly.
- Each confirmed AI task must retain an evidence quote that is a non-empty continuous substring of the input text.
- Unknown due dates are represented by an empty local due date and a `null` draft `dueAt`; no date may be inferred without evidence.
- API keys live only in CloudBase Secrets or ignored `.dev.vars` files and never in source, fixtures, logs, or README examples.
- Every production behavior is implemented test-first using the Node.js built-in assertion style already used in `tests/`.
- All existing test files and all new test files must pass before each task commit.

---

## Planned File Structure

| Path | Responsibility |
| --- | --- |
| `utils/plan-proof/draft.js` | Normalize and validate model task drafts against input text. |
| `utils/plan-proof/task-mapper.js` | Convert a validated draft into the payload and PlanProof metadata stored by `utils/todo.js`. |
| `utils/plan-proof/schedule.js` | Build a deterministic, capacity-limited daily plan and overflow explanation. |
| `utils/plan-proof/calibration.js` | Derive a bounded personal estimate multiplier from completed task records. |
| `utils/plan-proof/ingest-state.js` | Convert request and validation states into a testable ingest-page view model. |
| `utils/plan-proof/plan-state.js` | Convert todos and schedule output into a testable plan-page view model. |
| `cloudfunctions/task-extractor/index.js` | CloudBase entry point; validates input, requests model output, and returns untrusted drafts. |
| `cloudfunctions/task-extractor/validate.js` | Server-side JSON-shape validation for the model response. |
| `cloudfunctions/task-extractor/package.json` | Declares the cloud function runtime dependency set. |
| `pages/ingest/*` | Text input, draft review, edit, rejection, and explicit confirmation UI. |
| `pages/plan/*` | Today capacity picker, deterministic plan, overflow, and actual-duration feedback UI. |
| `tests/plan-proof-*.test.js` | Isolated tests for all new pure behavior and one workflow regression. |
| `evals/notification-fixtures.js` | Anonymized, versioned extraction fixtures and expected outcomes. |
| `README.md` | V2 setup, CloudBase secret configuration, privacy boundary, demo, and test commands. |
| `.gitignore` | Keeps local CloudBase secret files out of Git. |

## Task 1: Draft validation and evidence grounding

**Files:**
- Create: `utils/plan-proof/draft.js`
- Create: `tests/plan-proof-draft.test.js`

**Interfaces:**
- Produces: `validateDraftResponse(sourceText, response) -> { validTasks, invalidTasks }`.
- Valid task shape: `{ title, dueAt, priority, estimateMinutes, evidenceQuote, confidence, uncertainties }`.
- Invalid task shape: `{ index, reason }` where `reason` is one of `invalid_title`, `invalid_due_at`, `invalid_priority`, `invalid_estimate`, `invalid_evidence`, or `invalid_confidence`.

- [ ] **Step 1: Write the failing test for a grounded draft**

```js
const assert = require('assert')
const { validateDraftResponse } = require('../utils/plan-proof/draft')

const source = '请于2026年9月1日前提交创新创业比赛报名表。'
const result = validateDraftResponse(source, {
  tasks: [{
    title: '提交创新创业比赛报名表',
    dueAt: '2026-09-01',
    priority: 'high',
    estimateMinutes: 30,
    evidenceQuote: '请于2026年9月1日前提交创新创业比赛报名表',
    confidence: 0.9,
    uncertainties: [],
  }],
})

assert.strictEqual(result.validTasks.length, 1)
assert.strictEqual(result.invalidTasks.length, 0)
```

- [ ] **Step 2: Run the test and confirm it fails because the module is missing**

Run: `node tests/plan-proof-draft.test.js`

Expected: failure containing `Cannot find module '../utils/plan-proof/draft'`.

- [ ] **Step 3: Add the minimum validator**

```js
function validateDraftResponse(sourceText, response) {
  const tasks = Array.isArray(response && response.tasks) ? response.tasks : []
  const validTasks = []
  const invalidTasks = []

  tasks.forEach((task, index) => {
    const checked = validateTask(sourceText, task)
    if (checked.ok) validTasks.push(checked.task)
    else invalidTasks.push({ index, reason: checked.reason })
  })
  return { validTasks, invalidTasks }
}
```

Implement `validateTask` so it trims text fields, accepts only `low`, `medium`, or `high`, accepts `YYYY-MM-DD` or `null` for `dueAt`, requires a positive integer estimate or `null`, requires an exact non-empty evidence substring, and accepts confidence from `0` to `1`.

- [ ] **Step 4: Add and run rejection tests**

Add tests proving an invented evidence quote, an invalid priority, and an unknown date represented by `null` produce the documented results.

Run: `node tests/plan-proof-draft.test.js`

Expected: exit code `0`.

- [ ] **Step 5: Run the full suite and commit**

Run:

```powershell
Get-ChildItem tests\*.test.js | Sort-Object Name | ForEach-Object { node $_.FullName }
```

Commit:

```powershell
git add utils/plan-proof/draft.js tests/plan-proof-draft.test.js
git commit -m "feat: validate PlanProof task drafts"
```

## Task 2: Persist confirmed AI-task metadata safely

**Files:**
- Create: `utils/plan-proof/task-mapper.js`
- Modify: `utils/todo.js`
- Create: `tests/plan-proof-task-mapper.test.js`

**Interfaces:**
- Consumes: a validated task from `validateDraftResponse`.
- Produces: `toTodoPayload(task) -> { title, dueDate, priority, note, estimateMinutes, planProof }`.
- `planProof` stored on a todo: `{ evidenceQuote, confidence, uncertainties, importedAt }`.
- Adds: `recordActualMinutes(id, actualMinutes) -> { ok, message? }` in `utils/todo.js`.

- [ ] **Step 1: Write failing mapping and persistence tests**

```js
const assert = require('assert')
const { toTodoPayload } = require('../utils/plan-proof/task-mapper')

const payload = toTodoPayload({
  title: '提交报名表', dueAt: '2026-09-01', priority: 'high',
  estimateMinutes: 30, evidenceQuote: '9月1日前提交报名表',
  confidence: 0.9, uncertainties: ['未说明提交平台'],
})

assert.strictEqual(payload.dueDate, '2026-09-01')
assert.strictEqual(payload.planProof.evidenceQuote, '9月1日前提交报名表')
assert.strictEqual(payload.estimateMinutes, 30)
```

Create a `wx` storage fake following `tests/todo-advanced.test.js`; assert that `todo.addTodo(payload)` keeps `estimateMinutes` and `planProof`, and `recordActualMinutes(id, 45)` stores `actualMinutes: 45`.

- [ ] **Step 2: Run tests and confirm missing-module or missing-field failures**

Run: `node tests/plan-proof-task-mapper.test.js`

Expected: failure caused by absent mapper or absent persistence behavior.

- [ ] **Step 3: Implement the mapper and minimal todo extensions**

`toTodoPayload` converts a null due date to `''`, creates a concise note containing the evidence and uncertainties, and sets `importedAt` with `Date.now()`.

Extend `addTodo` and `updateTodo` only to retain `estimateMinutes` as a positive integer or `null`, `actualMinutes` as a positive integer or `null`, and the `planProof` object. `recordActualMinutes` rejects unknown ids and non-positive numeric values.

- [ ] **Step 4: Run the focused and full test suites**

Run:

```powershell
node tests/plan-proof-task-mapper.test.js
Get-ChildItem tests\*.test.js | Sort-Object Name | ForEach-Object { node $_.FullName }
```

Expected: both commands exit with `0`.

- [ ] **Step 5: Commit**

```powershell
git add utils/plan-proof/task-mapper.js utils/todo.js tests/plan-proof-task-mapper.test.js
git commit -m "feat: store confirmed PlanProof tasks"
```

## Task 3: Deterministic scheduling and calibration

**Files:**
- Create: `utils/plan-proof/schedule.js`
- Create: `utils/plan-proof/calibration.js`
- Create: `tests/plan-proof-schedule.test.js`

**Interfaces:**
- Produces: `getCalibrationFactor(todos) -> number` clamped from `0.5` to `2` and defaulting to `1` without completed estimates.
- Produces: `buildDailyPlan(todos, { today, capacityMinutes, calibrationFactor }) -> { items, overflowIds, plannedMinutes, remainingMinutes }`.
- A plan item shape: `{ id, title, adjustedMinutes, dueDate, priority }`.

- [ ] **Step 1: Write failing calendar-independent tests**

```js
const assert = require('assert')
const { buildDailyPlan } = require('../utils/plan-proof/schedule')

const plan = buildDailyPlan([
  { id: 'due', title: '今天交作业', dueDate: '2026-08-24', priority: 'high', estimateMinutes: 60 },
  { id: 'later', title: '整理笔记', dueDate: '2026-08-30', priority: 'low', estimateMinutes: 60 },
], { today: '2026-08-24', capacityMinutes: 60, calibrationFactor: 1 })

assert.deepStrictEqual(plan.items.map((item) => item.id), ['due'])
assert.deepStrictEqual(plan.overflowIds, ['later'])
assert.strictEqual(plan.plannedMinutes, 60)
```

Add a calibration test where completed tasks estimated at `30` and actually taking `45` yield `1.5`.

- [ ] **Step 2: Run and observe expected failure**

Run: `node tests/plan-proof-schedule.test.js`

Expected: failure because the scheduler and calibration modules do not exist.

- [ ] **Step 3: Implement smallest deterministic rules**

Sort unfinished tasks by overdue, due date, priority (`high`, `medium`, `low`), then creation order. For each task, use `ceil(estimateMinutes * calibrationFactor)`; tasks with no estimate use `30` minutes. Add tasks only while cumulative minutes do not exceed capacity. Return remaining eligible ids as `overflowIds`.

`getCalibrationFactor` uses only tasks with both positive `estimateMinutes` and positive `actualMinutes`; it returns the arithmetic mean of `actualMinutes / estimateMinutes`, then clamps to `[0.5, 2]`.

- [ ] **Step 4: Add edge-case tests and run all tests**

Add tests for a null estimate, a completed task being excluded, an overdue task outranking a later high-priority task, and a factor clamped at `2`.

Run the focused file then the full test suite; both must exit with `0`.

- [ ] **Step 5: Commit**

```powershell
git add utils/plan-proof/schedule.js utils/plan-proof/calibration.js tests/plan-proof-schedule.test.js
git commit -m "feat: add deterministic PlanProof planning"
```

## Task 4: CloudBase extraction function with a testable provider boundary

**Files:**
- Create: `cloudfunctions/task-extractor/index.js`
- Create: `cloudfunctions/task-extractor/validate.js`
- Create: `cloudfunctions/task-extractor/package.json`
- Create: `tests/plan-proof-cloud-function.test.js`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `createMain({ requestModel }) -> async (event) => result`.
- Input event: `{ text: string }`.
- Successful result: `{ ok: true, response: { tasks: [] } }`.
- Rejected result: `{ ok: false, code: 'invalid_input' | 'model_failure' | 'invalid_model_response', message: string }`.

- [ ] **Step 1: Write a failing injected-provider test**

```js
const assert = require('assert')
const { createMain } = require('../cloudfunctions/task-extractor')

const main = createMain({
  requestModel: async () => ({ tasks: [{ title: '提交报名表' }] }),
})

main({ text: '请提交报名表。' }).then((result) => {
  assert.strictEqual(result.ok, true)
  assert.strictEqual(result.response.tasks[0].title, '提交报名表')
})
```

Also assert blank input returns `invalid_input`, a thrown provider error returns `model_failure`, and a non-object provider response returns `invalid_model_response`.

- [ ] **Step 2: Run the test and confirm it fails because the function is absent**

Run: `node tests/plan-proof-cloud-function.test.js`

Expected: failure containing `Cannot find module '../cloudfunctions/task-extractor'`.

- [ ] **Step 3: Implement the function and remote provider**

`validate.js` accepts only an object with a `tasks` array. `createMain` trims input, rejects blank text or text longer than `5000` characters, calls the injected provider, and normalizes expected failures without exposing secrets.

The production `exports.main` constructs `requestModel` from `process.env.MODEL_API_URL`, `process.env.MODEL_API_KEY`, and `process.env.MODEL_NAME`; it sends an OpenAI-compatible JSON request and asks for only the V2 task-draft contract. The function returns untrusted drafts; evidence grounding remains authoritative in the mini program.

Add `.dev.vars*` and `cloudfunctions/task-extractor/.dev.vars*` to `.gitignore`.

- [ ] **Step 4: Run function, regression, and secret-leak checks**

Run:

```powershell
node tests/plan-proof-cloud-function.test.js
Get-ChildItem tests\*.test.js | Sort-Object Name | ForEach-Object { node $_.FullName }
rg -n "MODEL_API_KEY=|sk-[A-Za-z0-9]" -g '!docs/superpowers/plans/*' -g '!docs/superpowers/specs/*' .
```

Expected: both test commands exit with `0`; the `rg` command finds no source secrets.

- [ ] **Step 5: Commit**

```powershell
git add cloudfunctions/task-extractor tests/plan-proof-cloud-function.test.js .gitignore
git commit -m "feat: add CloudBase task extraction function"
```

## Task 5: Ingest page with explicit user confirmation

**Files:**
- Create: `utils/plan-proof/ingest-state.js`
- Create: `tests/plan-proof-ingest-state.test.js`
- Create: `pages/ingest/ingest.js`
- Create: `pages/ingest/ingest.json`
- Create: `pages/ingest/ingest.wxml`
- Create: `pages/ingest/ingest.wxss`
- Modify: `app.json`
- Modify: `pages/index/index.js`
- Modify: `pages/index/index.wxml`

**Interfaces:**
- Produces: `buildIngestState({ sourceText, validTasks, invalidTasks, loading, error }) -> object`.
- Page action: `onConfirmTask` calls `todo.addTodo(toTodoPayload(task))` only for locally validated tasks.

- [ ] **Step 1: Write a failing view-model test**

```js
const assert = require('assert')
const { buildIngestState } = require('../utils/plan-proof/ingest-state')

const state = buildIngestState({
  sourceText: '请提交报名表。',
  validTasks: [{ title: '提交报名表', evidenceQuote: '提交报名表', uncertainties: [] }],
  invalidTasks: [{ index: 1, reason: 'invalid_evidence' }],
  loading: false,
  error: '',
})

assert.strictEqual(state.canExtract, true)
assert.strictEqual(state.canConfirm, true)
assert.strictEqual(state.invalidSummary, '1 条结果未通过证据校验')
```

- [ ] **Step 2: Run and verify the missing-module failure**

Run: `node tests/plan-proof-ingest-state.test.js`

Expected: failure because the state helper does not exist.

- [ ] **Step 3: Implement helper, page, and navigation**

Implement the helper first. Add `pages/ingest/ingest` to `app.json`; add `onNavIngest` and a clearly labelled “AI 导入” entry on the index page.

The ingest page must have: a `5000`-character textarea; an extract button disabled for blank text; loading text; a model-error state that retains text; task cards showing title, due date, estimate, evidence quote, confidence, and uncertainties; and a per-task confirm button. Confirming a task creates one local todo, removes only that card, and displays a success toast.

Use `wx.cloud.callFunction({ name: 'task-extractor', data: { text } })` only after client-side text length validation. Pass returned drafts through `validateDraftResponse` before rendering them.

- [ ] **Step 4: Run logic tests and manually verify the visible flow**

Run all Node test files. In WeChat Developer Tools, verify: blank input cannot submit; failed extraction retains text; an invalid evidence quote cannot show a confirm button; confirming one valid card adds exactly one todo and does not save another card.

- [ ] **Step 5: Commit**

```powershell
git add utils/plan-proof/ingest-state.js tests/plan-proof-ingest-state.test.js pages/ingest app.json pages/index/index.js pages/index/index.wxml
git commit -m "feat: add evidence-based AI task import"
```

## Task 6: Daily-plan page and actual-duration feedback

**Files:**
- Create: `utils/plan-proof/plan-state.js`
- Create: `tests/plan-proof-plan-state.test.js`
- Create: `pages/plan/plan.js`
- Create: `pages/plan/plan.json`
- Create: `pages/plan/plan.wxml`
- Create: `pages/plan/plan.wxss`
- Modify: `app.json`
- Modify: `pages/index/index.js`
- Modify: `pages/index/index.wxml`

**Interfaces:**
- Produces: `buildPlanState(todos, options) -> { plan, calibrationPercent, overflowText }`.
- Page action: `onSaveActualMinutes` calls `todo.recordActualMinutes(todoId, minutes)`.

- [ ] **Step 1: Write a failing plan view-model test**

```js
const assert = require('assert')
const { buildPlanState } = require('../utils/plan-proof/plan-state')

const state = buildPlanState([
  { id: 'a', title: '提交报名表', dueDate: '2026-08-24', priority: 'high', estimateMinutes: 30 },
], { today: '2026-08-24', capacityMinutes: 60 })

assert.strictEqual(state.plan.items[0].id, 'a')
assert.strictEqual(state.calibrationPercent, 100)
assert.strictEqual(state.overflowText, '')
```

- [ ] **Step 2: Run and confirm the expected missing-module failure**

Run: `node tests/plan-proof-plan-state.test.js`

Expected: failure because `plan-state.js` is absent.

- [ ] **Step 3: Implement helper and page**

`buildPlanState` calls `getCalibrationFactor` and `buildDailyPlan`, rounds the factor to a whole percent, and creates an overflow text that states the number of tasks that do not fit.

The plan page offers `60`, `120`, and `180` minute capacity choices, displays planned tasks and their adjusted minutes, displays overflow tasks without hiding them, and provides an actual-minutes input plus save action for each planned task. Add a labelled “今日计划” entry on the index page and register the page in `app.json`.

- [ ] **Step 4: Run logic tests and manually verify plan behavior**

Run all Node test files. In WeChat Developer Tools, verify: changing capacity recomputes the plan; completed todos are excluded; overflow remains visible; non-positive actual minutes are rejected; valid actual minutes persist after reopening the page.

- [ ] **Step 5: Commit**

```powershell
git add utils/plan-proof/plan-state.js tests/plan-proof-plan-state.test.js pages/plan app.json pages/index/index.js pages/index/index.wxml
git commit -m "feat: add calibrated daily planning"
```

## Task 7: Fixtures, documentation, and release-quality verification

**Files:**
- Create: `evals/notification-fixtures.js`
- Create: `tests/plan-proof-workflow.test.js`
- Modify: `README.md`
- Modify: `project.config.json`

**Interfaces:**
- Fixture shape: `{ id, sourceText, modelResponse, validCount, invalidCount }`.
- Workflow test consumes fixtures, `validateDraftResponse`, `toTodoPayload`, `todo.addTodo`, and `buildDailyPlan`.

- [ ] **Step 1: Write a failing end-to-end workflow test**

```js
const assert = require('assert')
const fixtures = require('../evals/notification-fixtures')
const { validateDraftResponse } = require('../utils/plan-proof/draft')

const fixture = fixtures.find((item) => item.id === 'multiple-tasks')
const result = validateDraftResponse(fixture.sourceText, fixture.modelResponse)

assert.strictEqual(result.validTasks.length, fixture.validCount)
assert.strictEqual(result.invalidTasks.length, fixture.invalidCount)
```

- [ ] **Step 2: Run and confirm the fixture-module failure**

Run: `node tests/plan-proof-workflow.test.js`

Expected: failure because the fixture module is absent.

- [ ] **Step 3: Add fixtures and user documentation**

Create at least four anonymous fixtures: one explicit deadline, one unknown deadline, one notification with two valid tasks, and one invented-evidence rejection. Extend the workflow test through local todo persistence and scheduling.

Update `README.md` with V1/V2 positioning, local test commands, CloudBase environment initialization, the three required secret names (`MODEL_API_URL`, `MODEL_API_KEY`, `MODEL_NAME`), the statement that secrets are never committed, the text-only V2 scope, the evidence-confirmation flow, and a manual Developer Tools verification checklist.

Set `cloudfunctionRoot` to `cloudfunctions/` in `project.config.json` so WeChat Developer Tools recognizes the CloudBase function directory.

- [ ] **Step 4: Run release-quality checks**

Run:

```powershell
Get-ChildItem tests\*.test.js | Sort-Object Name | ForEach-Object { node $_.FullName }
rg -n "MODEL_API_KEY=|sk-[A-Za-z0-9]" -g '!docs/superpowers/plans/*' -g '!docs/superpowers/specs/*' .
git diff --check main...HEAD
git status --short
```

Expected: all tests exit with `0`; the secret scan has no matches; `git diff --check` has no output; status is clean after committing.

- [ ] **Step 5: Commit**

```powershell
git add evals/notification-fixtures.js tests/plan-proof-workflow.test.js README.md project.config.json
git commit -m "docs: document PlanProof V2 workflow"
```

## Plan Self-Review

- Spec coverage: Tasks 1-3 implement evidence validation, local persistence, deterministic planning, and calibration; Task 4 implements the stateless CloudBase boundary and secret handling; Tasks 5-6 implement the approved user flows and failure states; Task 7 implements fixtures, documentation, and release checks.
- Placeholder scan: the plan contains no deferred requirements or unspecified error handling; each task has named files, interfaces, test behavior, commands, and a commit.
- Type consistency: `validateDraftResponse` produces the task shape consumed by `toTodoPayload`; `todo` persists the fields consumed by `getCalibrationFactor` and `buildDailyPlan`; page helpers consume the same functions rather than duplicating rules.
