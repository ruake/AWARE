---
name: AWARE architecture fixes applied
description: Durable decisions and conventions established during the comprehensive audit fix pass.
---

## Signed duration diff in computeDiffRows (runs.ts)

`durSlowdown = (durCand - durBase) / durBase` — signed, not `Math.abs`.
- Only `durSlowdown > DURATION_CHANGE_THRESHOLD (0.25)` → state `"duration"` (slowdown regression)
- Improvements (negative) → state `"unchanged"` (not flagged as a problem)

**Why:** `Math.abs` was flagging 30% faster candidates as "duration" changes, making regressions and improvements indistinguishable in the Compare view.

## PROMOTION_GATE_THRESHOLD in CiConfig

`PROMOTION_GATE_THRESHOLD = 0.95` is now exported and surfaced in the generated YAML:
```ts
promotionGate: { threshold: 0.95, description: "UAT ... ≥ 95% ... PROD" }
```

**Why:** The threshold was defined but never emitted in the generated config, meaning downstream CI systems had no machine-readable gate value.

## RUNNER_MAP — explicit over ternary chains

`ciConfig.ts` uses an explicit `RUNNER_MAP: Record<string, "playwright" | "pytest">` instead of nested ternaries. All known testTypes (`web`, `playwright`, `pytest`, `puppeteer`, `selenium`, `api`, `http`, `edgeworker`, `transaction`) are listed. Unknown types fall back to `"pytest"` via `?? "pytest"`.

**Why:** The original ternary chain silently defaulted to `"pytest"` for any new testType without surfacing that it was unrecognised. The map makes additions explicit.

## anomalyDetection.test.ts module mocking pattern

Use a module-level `let _mockRuns: Run[] = []` variable + `Object.defineProperty` / getter in `vi.mock` to avoid the dangerous `(runsModule.RUNS as Run[]).length = 0` mutation pattern. Reset in `beforeEach` by assigning `_mockRuns = []`.

## ConsoleSidebar label consistency

`PANEL_LABELS.trends` must be `"Trends"` (not `"Analytics"`). The nav group label in ConsoleShell.tsx, routeLabel, and PANEL_LABELS must all agree on "Trends".

## activeIdFromPath suites → tests

`suites` segment must map to `"tests"` in `activeIdFromPath` (App.tsx redirects /suites → /tests). Without this, bookmarked /suites URLs would highlight the wrong sidebar item.
