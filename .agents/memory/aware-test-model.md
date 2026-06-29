---
name: AWARE Test Model
description: TestCase, TestSuite, TestResult, DiffRow, PromotionDecision types, testType taxonomy, and flakiness formula.
---

# AWARE Test Model

## Core Types (all in `src/lib/types.ts`)

### Run
The top-level record for a CI test execution:
```ts
{ id, label, suite, target, status, passPct, failures, duration, durationMs, started, build, rev, env, network }
```
- `env`: `"QA"` | `"UAT"` | `"PROD"` (not "production"/"staging" — those are legacy)
- `status`: `"PASS"` | `"FAIL"` | `"PARTIAL"` | `"FLAKY"` | `"RUNNING"`
- `network`: `"staging"` | `"production"` — Akamai network tier

### TestResult
Individual test outcome within a run:
```ts
{ id, name, status, duration, category, suite, error?, assertions?, evidence, filmstrip? }
```
- `evidence`: full HTTP req/res with headers, body, cookies — the "proof"
- `filmstrip`: Playwright screenshot frames for visual regression

### TestCase
The test definition (not a result):
- `testType`: `"web"` | `"api"` | `"http"` | `"edgeworker"` | `"transaction"` | `"pytest"`
- `priority`: `"P0"` | `"P1"` | `"P2"` | `"P3"`
- `severity`: `"critical"` | `"major"` | `"minor"` | `"trivial"`
- `status`: `"active"` | `"disabled"` | `"deprecated"`
- `predicates`: structured assertions (statusCode, headerEquals, responseTime, etc.)
- `assertions`: typed assertion list (statusCode, header, body, responseTime, cookie, jsonPath)
- `changelog`: versioned history of test changes
- `repoStatus`: `"not_checked"` | `"synced"` | `"modified"` | `"missing"` — GitHub sync state

### TestSuite
Hierarchical container:
- `parentId: string | null` — enables tree structure (`SuiteNode`)
- `config`: includes `target`, `environment`, `parallelism`, `retries`, `failFast`, `timeoutMinutes`, `integration`
- `integration`: Slack/webhook notifications, GitHub PR comments, approval gates with named approvers

### DiffRow
Compare page unit — pre-computed delta between two runs:
- `state`: `"regression"` | `"fixed"` | `"duration"` | `"unchanged"` | `"fishy"`
- `baseStatus` / `candStatus`: individual run outcomes
- `durBase` / `durCand`: duration in ms for each run

### PromotionDecision
```ts
{ runId, decision: "promote"|"block"|"pending", decidedBy?, decidedAt?, note? }
```
Promotion gate: UAT regression must achieve ≥ 95% pass rate before PROD property activation.

## Flakiness Score Formula
```
score = (status_flips / (total_runs - 1)) * 100
```
- `status_flips`: count of consecutive PASS→FAIL or FAIL→PASS transitions
- Score > 20 = flagged as flaky (concern threshold)
- Computed in `runs.ts:computeTestDetails()` and `runs.ts:computeTestDetailForName()`

## TestDetail Shape
```ts
{ history: TestRunPoint[], passRate: number, flakinessScore: number, avgDuration: number }
```

## Job Runner Types
- `JobType`: `"test-run"` | `"discovery"` | `"sync"` | `"build"` | `"custom"`
- `JobStatus`: `"pending"` | `"running"` | `"completed"` | `"failed"` | `"cancelled"`

## How to Apply
- When filtering runs, always use the `env` field (QA/UAT/PROD), not `target` or `network` alone
- `DiffRow.state === "fishy"` means a test passes in base but has suspicious duration changes
- TestCase `assertions` array is for display/documentation; `predicates` are the executable runtime checks
- Always include `evidence` in new TestResult — it is REQUIRED (not optional)
