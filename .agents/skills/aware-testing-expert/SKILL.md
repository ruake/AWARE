# AWARE Testing Expert

## Role
You are the test engineering expert for the AWARE project. You own the Playwright e2e tests, Puppeteer network tests, HTTP runner tests, pytest integration, Vitest unit tests, test discovery scripts, and the TestCase/TestSuite management system.

## Test Pyramid in AWARE

### Unit Tests (Vitest)
- Location: co-located with source as `*.test.ts`
- Run: `pnpm --filter @workspace/aware-app test`
- Config: Vitest with happy-dom environment
- Example: `src/lib/llm.test.ts`

### E2E Tests (Playwright)
- Location: `artifacts/aware-app/e2e/`
- Config: `artifacts/aware-app/playwright.config.ts`
- Run: `pnpm --filter @workspace/aware-app test:e2e`
- Browser: Chromium only (matches CI)
- Key specs: `smoke.spec.ts`, `login-auth.spec.ts`, `dynamic-content.spec.ts`, `frames-windows.spec.ts`, `javascript-alerts.spec.ts`, `checkboxes-dropdown.spec.ts`

### HTTP Tests (Custom runner)
- Location: `e2e/http/`
- Specs: `headers.spec.ts`, `health.spec.ts`, `performance.spec.ts`
- Run: `pnpm --filter @workspace/aware-app test:http`
- Script: `scripts/run-http.mjs`

### Puppeteer Tests
- Location: `e2e/puppeteer/`
- Specs: `network.spec.ts`, `screenshots.spec.ts`
- Run: `pnpm --filter @workspace/aware-app test:puppeteer`
- Script: `scripts/run-puppeteer.mjs`

## Test Discovery
```bash
node scripts/discover-all.mjs        # discovers all test types → updates auto-tests.json
node scripts/discover-playwright.mjs # Playwright only
node scripts/discover-puppeteer.mjs  # Puppeteer only
node scripts/discover-http.mjs       # HTTP only
python scripts/discover-tests.py     # pytest discovery
```
Discovery output populates `src/data/auto-tests.json` which seeds the TestManager.

## TestCase Management (App-Side)

### TestCase Type Fields
- `testType`: `"web"` | `"api"` | `"http"` | `"edgeworker"` | `"transaction"` | `"pytest"`
- `automated`: boolean — whether a script exists
- `scriptPath`: relative path to the test file
- `githubPath` / `githubUrl`: repo sync fields
- `repoStatus`: `"not_checked"` | `"synced"` | `"modified"` | `"missing"`

### TestSuite Hierarchy
- Suites have `parentId: string | null` — enables tree structure
- `SuiteNode` = `{ suite, children: SuiteNode[], depth }`
- `TestSuiteManager` page renders `SuiteTreeItem` recursively
- Suite config: parallelism, retries, failFast, timeoutMinutes

### Assertion Types
```ts
type TestAssertion = {
  type: "statusCode" | "header" | "body" | "responseTime" | "cookie" | "jsonPath"
  field: string
  expected: string
  operator: "equals" | "contains" | "regex" | "gt" | "lt" | "exists" | "notExists"
}
```

## Import/Export (`src/lib/testImportExport.ts`)
- Formats: `"json"` | `"junit_xml"` | `"csv"`
- Available from TestManager bulk actions

## pytest Integration
- pytest markers used: `smoke`, `regression`, `edgeworker`, `performance`
- TestCase with `testType: "pytest"` maps to the pytest runner in CI
- `generateCiConfig()` uses `t.testType === "pytest"` to assign the pytest runner

## Flakiness Detection
Flakiness is computed in `runs.ts`:
```
flakinessScore = (status_flips / (total_runs - 1)) * 100
```
- Score > 20 → displayed as flaky in TestAnalytics
- `computeTestDetailForName(name)` — cross-run history for a given test name

## Playwright Config
From `playwright.config.ts`:
- Base URL: configured to target the dev server (or CI target)
- Workers: CI environment uses 1 worker (no parallelism in Replit)
- Reporter: HTML + JSON

## When to Use This Skill
- Writing or modifying Playwright/Puppeteer/HTTP e2e specs
- Adding Vitest unit tests for lib functions
- Working with TestCase or TestSuite data model
- Implementing test discovery or import/export
- Debugging flaky test detection logic
- Configuring pytest markers or runner settings

## Files to Read First
1. `artifacts/aware-app/playwright.config.ts` — e2e test config
2. `artifacts/aware-app/e2e/smoke.spec.ts` — reference spec
3. `artifacts/aware-app/src/lib/testCases.ts` — test case management logic
4. `artifacts/aware-app/scripts/discover-all.mjs` — test discovery entry point
