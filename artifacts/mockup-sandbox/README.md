# A.W.A.K.E. — Akamai Web Analyser & Kit for Evaluations

Cross-target CDN test observability SPA. Browse runs, inspect HTTP evidence,
compare baselines vs candidates, drill into per-test analytics. Zero backend —
works as a static site on GitHub Pages.

**[Live Demo](https://ruake.github.io/AWARE)**

---

## Quick Start (5 minutes)

### Prerequisites

- **Node.js ≥ 18** — check with `node --version`. If missing, download from
  [nodejs.org](https://nodejs.org/).
- **pnpm** — install once: `npm install -g pnpm`. If `npm` isn't installed,
  install Node.js first (it includes npm). Do NOT use `npm` or `yarn` for
  this project's dependencies — only `pnpm` is supported.
- **Git** — verify with `git --version`.

### Step 1: Get the code

```bash
git clone https://github.com/YOUR_ORG/AWARE.git   # replace YOUR_ORG
cd AWARE
```

If you don't have a fork yet, click "Fork" on GitHub first, then clone your fork.

### Step 2: Install dependencies

```bash
cd artifacts/mockup-sandbox
pnpm install          # ✅ correct
# npm install         # ❌ WRONG — will fail or produce wrong lockfile
# yarn                # ❌ WRONG — not supported
```

**If `pnpm install` fails:**
- "command not found: pnpm" → run `npm install -g pnpm` first
- "ERR_PNPM_OUTDATED_LOCKFILE" → delete `pnpm-lock.yaml` and retry

### Step 3: Start the dev server

```bash
PORT=5173 BASE_PATH=/ pnpm dev
```

Expected output:
```
VITE v7.x  ready in 200ms
➜  Local:   http://localhost:5173/
```

If your terminal shows a different port, set `PORT=3000 pnpm dev` or any free port.

**Open** http://localhost:5173/preview/aware/Dashboard

If you see a blank page or 404:
- Check the URL — must match `http://localhost:{PORT}/preview/aware/Dashboard`
- Make sure `BASE_PATH=/` is set (trailing slash required)
- Kill anything else on port 5173: `lsof -ti:5173 | xargs kill`

### Step 4: Production build

```bash
BASE_PATH=/AWARE PORT=1 pnpm build
```

Output goes to `artifacts/mockup-sandbox/dist/`. The `PORT=1` skips the dev
server and only runs the build step. If you omit `PORT=1`, the dev server starts
and blocks the build.

**Common mistakes:**
- Forgetting `BASE_PATH=/AWARE` → assets load from `/` instead of `/AWARE/`,
  causing 404s on GitHub Pages
- Forgetting `PORT=1` → server starts instead of building
- Running from the repo root instead of `artifacts/mockup-sandbox` → build fails

---

## Pages

| Page | URL | What it does |
|------|-----|-------------|
| Dashboard | `/preview/aware/Dashboard` | Multi-env pass-rate chart, health cards, regression alerts, version drift |
| Runs | `/preview/aware/Runs` | Filterable run table with column filters, side panel |
| Run Detail | `/preview/aware/RunDetail?runId=...` | Test results + evidence viewer (request/response/PM vars) |
| Compare | `/preview/aware/Compare?baseline=...&candidate=...` | Side-by-side diff of two runs, regression detection |
| New Run | `/preview/aware/StartRun` | Workflow dispatcher form with command previews |
| Search | `/preview/aware/SearchDemo` | Keyboard-navigable search across tests, runs, comparisons |
| Test Analytics | `/preview/aware/TestAnalytics?testId=...` | Per-test pass-rate trend, duration, flakiness |
| Test Doc | `/preview/aware/TestDoc` | Test documentation with git change history |
| Status | `/preview/aware/Status` | Live pipeline: GitHub Actions → static files → portal |
| About | `/preview/aware/About` | Project info, live stats, tech stack |

---

## Using Your Own Data

There are two paths. **Option 1** is fastest (no network setup). **Option 2** is
for CI/CD pipelines that generate data files on every test run.

### Option 1: Replace mock data directly

Edit the file `src/components/mockups/aware/_shared/data.ts` and swap the
exported arrays with your own data.

#### The 6 things you must replace

| Export | Type | What it powers |
|--------|------|----------------|
| `RUNS` | `Run[]` | Dashboard chart, Runs table, Run Detail, navigation |
| `DIFF_ROWS` | `DiffRow[]` | Compare page, Command Palette, About stats |
| `TEST_DETAILS` | `TestDetail[]` | Test Analytics per-test history |
| `ENV_SUMMARY` | `EnvSummary[]` | Dashboard health cards + alerts |
| `PASS_RATE_DATA` | `(string\|number)[][]` | Dashboard pass-rate chart series |
| `ENV_PASS_RATE_DATA` | `(string\|number)[][]` | Dashboard multi-env line chart |

#### What each field means (with JSON examples)

```ts
interface Run {
  id: string;        // unique ID, e.g. "run_abc123"
  label: string;     // human label, e.g. "Prod/Production · PM 1.0"
  suite: string;     // "full_suite", "regression", "smoke", "canary"
  target: string;    // "Prod", "UAT", "Staging", "Dev"
  status: "PASS" | "FAIL" | "PARTIAL" | "FLAKY";
  passPct: number;   // 0 to 100 (NOT 0.0–1.0)
  failures: number;
  duration: string;  // human duration, e.g. "45m" or "1h 12m"
  durationMs: number; // exact milliseconds
  started: string;   // ISO 8601, e.g. "2026-06-06T14:30:00Z"
  pm: string;        // Property Manager version, e.g. "v892"
  ew: string;        // EdgeWorker version, e.g. "2341.1.0"
  env: string;       // environment label, e.g. "Prod/Production"
}
```

```ts
interface DiffRow {
  id: string;                    // unique, e.g. "diff_0"
  name: string;                  // test name
  baseStatus: "PASS" | "FAIL";   // baseline result (NOT "PASSED")
  candStatus: "PASS" | "FAIL";   // candidate result (NOT "passed")
  durBase: number;               // baseline duration in ms
  durCand: number;               // candidate duration in ms
  category: string;              // e.g. "geo-match", "locale-split"
  state: "regression" | "fixed" | "duration" | "unchanged";
}
```

```ts
interface TestDetail {
  history: Array<{
    runId: string;
    status: "PASS" | "FAIL";
    duration: number;  // ms
    env: string;
  }>;
  passRate: number;       // 0–100
  flakinessScore: number; // 0–100
  avgDuration: number;    // ms
}
```

```ts
interface EnvSummary {
  label: string;          // e.g. "Prod/Production"
  passRate: number;       // 0–100
  trend: number;          // % change (positive = improvement)
  failures: number;
  color: string;          // hex with hash, e.g. "#d93025"
  alert: string | null;   // alert message or null
}
```

```ts
interface TestResult {
  id: string;
  name: string;
  status: "PASS" | "FAIL";
  duration: number;   // ms
  category: string;
  suite: string;
}
```

#### Common mistakes (❌ don't do these)

| Mistake | What happens |
|---------|-------------|
| `status: "PASSED"` instead of `"PASS"` | TypeScript compile error |
| `passPct: 0.87` instead of `87` | Chart shows 0% |
| `started: "2026/06/06"` instead of ISO 8601 | Sort order breaks |
| Missing `durationMs` | Duration column is empty |
| `state: "regression"` typoed as `"regresion"` | TypeScript compile error |
| `trend: -4` forgotten | Trend arrow shows incorrectly |
| `color: "red"` instead of `"#d93025"` | Card border color breaks |
| `alert: ""` instead of `null` | Empty alert banner shown |
| Missing comma between array items | Syntax error — build fails |
| Trailing comma in JSON file | If using static JSON, some parsers reject this |

#### After editing data.ts

```bash
pnpm run typecheck   # ✅ MUST pass before you commit
pnpm dev             # ✅ verify in browser
```

Set `VITE_USE_MOCK=true` (this is the default — no .env change needed).

---

### Option 2: Static JSON files served from the repo

Your CI pipeline generates JSON files that the portal fetches at runtime.
No rebuild needed when data changes — just push new JSON files.

#### File layout

Place JSON files under a `data/` directory. The portal expects this structure:

```
data/
├── runs.json                  # Run[]
├── diff.json                  # DiffRow[]
├── diff/
│   └── details.json           # TestDetail[]
└── dashboard/
    ├── env-summary.json       # EnvSummary[]
    ├── pass-rate.json         # Google Charts 2D array
    └── env-pass-rate.json     # Google Charts 2D array
```

The `diff/details.json` sits in a subdirectory because the API path is
`/diff/details`. The portal constructs the URL by appending the endpoint path
to `VITE_API_BASE_URL`.

#### Expected JSON shapes

Each file must contain exactly the JSON value of the corresponding type — no
wrapper object.

**`data/runs.json`** — must be an array:
```json
[
  {
    "id": "run_001",
    "label": "Prod/Production · PM v892 · EW 2341.1.0",
    "suite": "full_suite",
    "target": "Prod",
    "status": "PASS",
    "passPct": 100,
    "failures": 0,
    "duration": "45m",
    "durationMs": 2700000,
    "started": "2026-06-06T14:30:00Z",
    "pm": "v892",
    "ew": "2341.1.0",
    "env": "Prod/Production"
  }
]
```

**`data/diff.json`** — must be an array:
```json
[
  {
    "id": "diff_0",
    "name": "Check locale match for /api/v1/data",
    "baseStatus": "PASS",
    "candStatus": "FAIL",
    "durBase": 120,
    "durCand": 340,
    "category": "geo-match",
    "state": "regression"
  }
]
```

**`data/diff/details.json`** — must be an array:
```json
[
  {
    "history": [
      { "runId": "run_001", "status": "PASS", "duration": 120, "env": "Prod/Production" }
    ],
    "passRate": 85,
    "flakinessScore": 12,
    "avgDuration": 145
  }
]
```

**`data/dashboard/env-summary.json`** — must be an array:
```json
[
  {
    "label": "Prod/Production",
    "passRate": 87,
    "trend": -4,
    "failures": 14,
    "color": "#d93025",
    "alert": "PASS RATE DROPPED 4%"
  },
  {
    "label": "Prod/Staging",
    "passRate": 92,
    "trend": -2,
    "failures": 6,
    "color": "#f9ab00",
    "alert": null
  }
]
```

**`data/dashboard/pass-rate.json`** — Google Charts 2D array:
```json
[
  ["Day", "Pass Rate", { "type": "string", "role": "tooltip" }],
  ["Mon", 92, "run_001 — 92%"],
  ["Tue", 87, "run_002 — 87%"]
]
```

**`data/dashboard/env-pass-rate.json`** — Google Charts 2D array with env columns:
```json
[
  ["Day", "Prod/Production", "Prod/Staging", "UAT/Production", "UAT/Staging", { "type": "string", "role": "tooltip", "p": { "html": true } }],
  ["Mon", 92, 88, 100, 98, "<b>Mon</b><br>Prod/Prod: 92%<br>Prod/Stg: 88%..."]
]
```

#### Validate your JSON before deploying

```bash
# Check all JSON files are syntactically valid
for f in data/*.json data/diff/*.json data/dashboard/*.json; do
  node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" && echo "✅ $f" || echo "❌ $f"
done
```

This catches:
- Trailing commas (not valid in strict JSON — only in JavaScript)
- Missing quotes on keys
- Single quotes instead of double quotes
- Comments (JSON doesn't support `//` or `/* */`)

#### Configuration

Create a `.env` file in `artifacts/mockup-sandbox/`:

```bash
# .env — for local development with static files
VITE_USE_MOCK=false
VITE_API_BASE_URL=/data          # <-- no trailing slash!
```

**Crucial:** `VITE_API_BASE_URL` must NOT end with a trailing slash. The portal
appends a `/` between the base URL and the path automatically.

For GitHub Pages, the `VITE_API_BASE_URL` auto-resolves to `{BASE_URL}/data`
so you don't need to set it. `BASE_URL` is `/AWARE/` in production and `/` in dev.

#### Test with a local static file server

```bash
# From artifacts/mockup-sandbox/
cd data
npx serve --cors -p 3000          # serves JSON files on port 3000
```

Then in another terminal:
```bash
VITE_USE_MOCK=false VITE_API_BASE_URL=http://localhost:3000 pnpm dev
```

If you see CORS errors in the browser console, make sure you used `--cors`
with the `serve` command.

#### Sample GitHub Actions workflow

Create `.github/workflows/publish-status.yml` at the **repo root**
(NOT inside `artifacts/mockup-sandbox/` — workflows must be in the root).

```yaml
name: publish-status
on:
  schedule:
    - cron: "*/15 * * * *"   # every 15 minutes
  workflow_dispatch:          # manual trigger from GitHub UI

# REQUIRED: Pages deployment permissions
permissions:
  contents: write
  pages: write
  id-token: write

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # ── Generate your data files ──
      - name: Generate status data
        run: |
          mkdir -p data/dashboard data/diff

          # 👇 Replace with your actual data generation
          cat > data/runs.json << 'EOF'
          [{"id":"run_001","label":"Prod/Production · PM v892","suite":"full_suite","target":"Prod","status":"PASS","passPct":100,"failures":0,"duration":"45m","durationMs":2700000,"started":"2026-06-06T14:30:00Z","pm":"v892","ew":"2341.1.0","env":"Prod/Production"}]
          EOF

          cat > data/diff.json << 'EOF'
          [{"id":"diff_0","name":"Check locale","baseStatus":"PASS","candStatus":"FAIL","durBase":120,"durCand":340,"category":"geo-match","state":"regression"}]
          EOF

          cat > data/diff/details.json << 'EOF'
          [{"history":[{"runId":"run_001","status":"PASS","duration":120,"env":"Prod/Production"}],"passRate":85,"flakinessScore":12,"avgDuration":145}]
          EOF

          cat > data/dashboard/env-summary.json << 'EOF'
          [{"label":"Prod/Production","passRate":87,"trend":-4,"failures":14,"color":"#d93025","alert":"PASS RATE DROPPED 4%"}]
          EOF

          cat > data/dashboard/pass-rate.json << 'EOF'
          [["Day","Pass Rate",{"type":"string","role":"tooltip"}],["Mon",92,"run_001 — 92%"]]
          EOF

          cat > data/dashboard/env-pass-rate.json << 'EOF'
          [["Day","Prod/Production","Prod/Staging","UAT/Production","UAT/Staging",{"type":"string","role":"tooltip","p":{"html":true}}],["Mon",92,88,100,98,"<b>Mon</b><br>Prod/Prod: 92%"]]
          EOF

      # ── Validate generated JSON (fail early on bad data) ──
      - name: Validate JSON
        run: |
          for f in data/*.json data/diff/*.json data/dashboard/*.json; do
            node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" && echo "✅ $f" || { echo "❌ $f"; exit 1; }
          done

      # ── Deploy data/ directory to gh-pages branch ──
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./data
          destination_dir: data
          keep_files: false
```

**Before deploying, verify:**
1. The workflow file is at `.github/workflows/publish-status.yml` (not in a subdirectory)
2. `permissions` block is present (GitHub requires explicit Pages permissions)
3. All `cat > file << 'EOF'` blocks produce valid JSON — test locally first
4. The `destination_dir: data` is correct — this makes the files available at
   `https://{user}.github.io/{repo}/data/runs.json`

#### Verify live data

Once deployed, the portal fetches from:
```
https://{user}.github.io/{repo}/data/runs.json
https://{user}.github.io/{repo}/data/diff.json
https://{user}.github.io/{repo}/data/diff/details.json
https://{user}.github.io/{repo}/data/dashboard/env-summary.json
...
```

Open the URL directly in a browser — if you see your JSON data, the portal
will work. If you see a 404, check the `destination_dir` in the workflow.

---

## Graceful Fallback

When `VITE_USE_MOCK=false` and a fetch fails (network error, timeout, 404, CORS
block), the portal **does not crash**. It falls back to the bundled mock data
and logs a warning to the browser console:

```
[aware] runs.getAll failed (HTTP), using mock: 404 Not Found
```

To see these warnings, open **DevTools → Console** (F12).

This means you can deploy with partial data — missing files will just show
mock data instead of breaking the page.

---

## Configuration Reference

See [`.env.example`](.env.example) for all available options with comments.

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_USE_MOCK` | `true` | `true` = bundled mock data; `false` = fetch from static files/API |
| `VITE_API_BASE_URL` | `{BASE_URL}/data` | Base URL for data fetches. Auto-resolves for GitHub Pages. |
| `VITE_POLLING_INTERVAL_MS` | `30000` | Status page polling interval. Clamped to 5000–300000. |
| `VITE_REQUEST_TIMEOUT_MS` | `10000` | HTTP request timeout in ms. Clamped to 2000–60000. |
| `VITE_MAX_RETRIES` | `3` | Max retries for transient failures. Clamped to 0–10. |
| `VITE_RETRY_BASE_DELAY_MS` | `1000` | Base backoff delay in ms. Clamped to 200–30000. |
| `VITE_CACHE_BUST` | auto | `true` in dev, `false` in production. Appends `?_t={ts}` to URLs. |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Blank page at localhost:5173 | `BASE_PATH=/` not set | Restart with `BASE_PATH=/ pnpm dev` |
| Charts don't render, JS errors | Missing Google Charts API key | The default demo key should work — check ad blockers |
| `pnpm` command not found | pnpm not installed | `npm install -g pnpm` |
| `ERR_PNPM_OUTDATED_LOCKFILE` | Lockfile mismatch | Delete `pnpm-lock.yaml` and rerun `pnpm install` |
| Build fails with TS errors | Data.ts has wrong types | Run `pnpm run typecheck` and fix errors |
| `data/runs.json` 404 at runtime | File doesn't exist or wrong path | Open the URL directly in browser to verify |
| CORS error in console | Static file server lacks CORS headers | Use `npx serve --cors` or configure your CDN |
| Old data showing after push | Browser cache | Hard refresh (Cmd+Shift+R / Ctrl+F5) |
| 404 on GitHub Pages navigation | SPA routing fallback missing | Build needs to copy `index.html` → `404.html` — the deploy workflow does this automatically |
| `PORT=1` build never finishes | Missing `PORT=1` | The dev server runs instead — Ctrl+C and retry with `PORT=1` |
| Relative paths broken in prod | `BASE_PATH=/AWARE` missing | Rebuild with `BASE_PATH=/AWARE PORT=1 pnpm build` |
| Workflow not showing in Actions | Workflow file in wrong directory | Must be at `.github/workflows/publish-status.yml` (repo root, not inside `artifacts/`) |

---

## Data Architecture

```
data.ts                — Mock data (replace with your own or delete for production)
  ↕ imports types from
types.ts               — All TypeScript interfaces + error types
  ↕ wrapped by
services.ts            — Service interfaces + mock/API implementations
                       - Mock:   returns data.ts values wrapped in Promise
                       - API:    fetch with timeout, retry, fallback to mock
                       - Switch: VITE_USE_MOCK env var
  ↕ wrapped by
hooks.ts               — React hooks (useRuns, useDiffs, useEnvSummary, etc.)
                       - Async hooks: { data, loading, error, refetch }
                       - Sync hooks:  fills on mount, returns array directly
  ↕ consumed by
Components             — Dashboard, Runs, RunDetail, Compare, About, etc.
```

When `VITE_USE_MOCK=false` and a fetch fails, the `fallback()` wrapper in
`services.ts` catches the error and returns mock data transparently.

---

## License

MIT