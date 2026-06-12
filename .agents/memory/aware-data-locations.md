---
name: AWARE data file locations
description: Runtime JSON lives in data/ not src/data/ — critical for fixes that need to take effect in the browser.
---

## Rule
When fixing seed/runtime JSON data, always edit `artifacts/aware-app/data/<file>.json`.

## Why
`fetchJson()` in `dataFetcher.ts` fetches `/data/<file>.json` at runtime (dev mode = Vite static serving from `artifacts/aware-app/data/`). There is a stale duplicate folder at `artifacts/aware-app/src/data/` that is NOT served — edits there have no effect at runtime.

## How to apply
- Bug: scheduler-status.json had mismatched field names (`suiteId` vs `id`, `triggeredAt` vs `timestamp`, missing `environments`). Fixed in `data/` not `src/data/`.
- Any time the app fetches a JSON file and gets wrong/missing fields, check `data/` first.
- `src/data/` may be used for TypeScript imports (static data wired directly into modules) — check the import path to distinguish.
