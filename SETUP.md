# A.W.A.R.E. — Fork & Configure Guide

**Fork this repo, edit three config files, push — and everything else is automated.**

The AWARE dashboard deploys itself to GitHub Pages, runs your test suites on schedule via GitHub Actions, validates your configuration on every push, and keeps the dashboard data up to date automatically.

---

## Step 1 — Fork the repository

Click **Fork** on GitHub. No template config, no manual branch setup — just fork.

```
https://github.com/your-org/aware → Fork → your-org/aware
```

---

## Step 2 — Edit the three config files

All configuration lives in `config/`. Edit these three files and commit.

### `config/akamai-config.yml` — Your property metadata

```yaml
project:
  name: My CDN Dashboard          # display name in the UI
  repoUrl: https://github.com/your-org/aware   # ← your fork URL

properties:
  - name: www.example.com         # your Akamai property name
    contractId: ctr_ABCDEFGH      # Akamai contract ID
    groupId: grp_IJKLMNOP         # Akamai group ID
    cpcode: "9876543"             # CP code
    edgeHostname: www.example.com.edgekey.net
    activeVersions:
      qa: 10                      # active property version per tier
      uat: 9
      prod: 8
    promotionGate:
      minPassRate: 95             # % required for UAT → PROD promotion
      requiredSuites:
        - suite_smoke
        - suite_regression_uat
```

**Where to find these values:** Akamai Control Center → Properties → click your property → Contract, Group, and CP Code are shown in the sidebar. Property version is shown on the Versions tab.

### `config/environments.yml` — Your Akamai edge environments

Six environments are required: `qa_staging`, `qa_prod`, `uat_staging`, `uat_prod`, `prod_staging`, `prod_prod`.

```yaml
baseUrl: https://www.example.com
property: www.example.com
cpcode: "9876543"
edgeHostname: www.example.com.edgekey.net

environments:
  - id: qa_staging
    label: "QA / Staging"
    target: QA
    network: staging
    baseUrl: https://www.example.com
    ips:
      - 23.32.1.10       # Akamai staging network IPs for your property
    propertyVersion: 10
    propertyStatus: active

  # ... repeat for qa_prod, uat_staging, uat_prod, prod_staging, prod_prod
```

**Where to find the staging IPs:** Akamai Control Center → Manage → Diagnostics → Staging Network → look up your edge hostname.

### `config/test-suites.yml` — Your test suites and schedules

```yaml
suites:
  - id: suite_smoke
    name: Smoke — All Environments
    environments:
      - "QA / Staging"
      - "QA / Production"
      - "UAT / Staging"
      - "UAT / Production"
      - "PROD / Staging"
      - "PROD / Production"
    parallelism: 4
    retries: 1
    failFast: true
    timeoutMinutes: 5
    runners: [playwright, pytest]
    tags: [smoke]
    schedule: null              # null = triggered by deploy, not cron

  - id: suite_regression_uat
    name: Full Regression — UAT
    environments:
      - "UAT / Staging"
      - "UAT / Production"
    parallelism: 6
    retries: 2
    failFast: false
    timeoutMinutes: 30
    runners: [playwright, pytest]
    tags: [regression]
    schedule: "0 6 * * *"      # 06:00 UTC nightly
```

**Schedule format:** Standard 5-field cron expression, or `null` to disable. All times UTC.

---

## Step 3 — Validate your config locally (optional but recommended)

```bash
pnpm install
node scripts/validate-config.mjs
```

This runs the same checks as CI. Fix any errors shown before pushing.

---

## Step 4 — Enable GitHub Pages

1. Go to your fork → **Settings → Pages**
2. Set **Source** to **GitHub Actions**
3. Save

The dashboard will be live at `https://<your-org>.github.io/aware` after the first deploy.

---

## Step 5 — Set GitHub Actions permissions

Go to **Settings → Actions → General → Workflow permissions** and enable:

- ✅ **Read and write permissions**
- ✅ **Allow GitHub Actions to create and approve pull requests**

This allows the `deploy.yml` workflow to commit run data to the `data` branch.

---

## Step 6 — Add your tests

Place your test files in:

| Runner | Directory |
|--------|-----------|
| Playwright | `tests/` (`.spec.ts` files) |
| pytest | `tests/` (`.py` files) |

Tag Playwright tests with `@suite_smoke`, `@suite_regression_uat`, etc. to match your suite IDs:

```typescript
// tests/homepage.spec.ts
test('@suite_smoke homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/My Site/);
});
```

Tag pytest tests with `@pytest.mark.<suite_id>`:

```python
# tests/test_cdn.py
import pytest

@pytest.mark.suite_smoke
def test_homepage_status(base_url):
    r = requests.get(base_url)
    assert r.status_code == 200
```

---

## Step 7 — Push and watch it run

```bash
git add config/
git commit -m "configure: set up AWARE for my property"
git push origin main
```

This triggers:

1. **`validate-config.yml`** — validates your three config files (blocks merge on errors)
2. **`deploy.yml`** — runs CI checks, builds the React dashboard, deploys to GitHub Pages
3. **`scheduler.yml`** — every 15 minutes, checks for suites due by cron schedule and dispatches them

The dashboard URL appears in the Actions run summary of `deploy.yml`.

---

## Automated workflows overview

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| Config Validation | `validate-config.yml` | Push/PR to `config/` | Validate all YAML config files |
| Deploy Dashboard | `deploy.yml` | Push to `main` | Build + deploy static site to GitHub Pages |
| Run Tests | `run-tests.yml` | Manual / schedule / push | Execute Playwright + pytest suites |
| Scheduler | `scheduler.yml` | Every 15 min | Dispatch suites per cron schedule |
| Code Quality | `code-quality.yml` | Push/PR to `main` | Lint, typecheck, audit, CodeQL |

---

## Triggering a manual test run

```bash
gh workflow run run-tests.yml \
  --field suite=suite_smoke \
  --field environment="QA / Staging" \
  --field parallelism=4
```

Or use the GitHub UI: **Actions → A.W.A.R.E. CDN Tests → Run workflow**.

---

## Environment variables & secrets

Copy `.env.example` to `.env` for local development:

```bash
cp .env.example .env
```

For GitHub Actions, add secrets at **Settings → Secrets and variables → Actions**:

| Secret | Required | Purpose |
|--------|----------|---------|
| `VITE_LLM_API_KEY` | No | OpenAI key for the AI Copilot (leave unset to use mock mode) |
| `SLACK_WEBHOOK_URL` | No | Slack failure notifications |
| `PAGERDUTY_ROUTING_KEY` | No | PagerDuty PROD alerts |

`GITHUB_TOKEN` is provided automatically by GitHub Actions — you do not need to add it.

---

## Config validation rules

The validator (`scripts/validate-config.mjs`) checks:

**`akamai-config.yml`**
- `project.name` and `project.repoUrl` are set and not placeholder values
- Each property has real `contractId`, `groupId`, `cpcode` (not `ctr_XXXXXXXX` / `grp_XXXXXXXX`)
- `activeVersions` has numeric `qa`, `uat`, `prod` keys
- `promotionGate.minPassRate` is a number between 1 and 100
- `promotionGate.requiredSuites` references suites that exist in `test-suites.yml`

**`environments.yml`**
- All 6 canonical IDs present: `qa_staging`, `qa_prod`, `uat_staging`, `uat_prod`, `prod_staging`, `prod_prod`
- Each environment has `id`, `label`, `target` (QA/UAT/PROD), `network` (staging/production), valid `baseUrl`, numeric `propertyVersion`

**`test-suites.yml`**
- At least one suite defined
- Each suite references environment labels that exist in `environments.yml`
- `runners` contains only `playwright` and/or `pytest`
- `schedule` is a valid 5-field cron expression or `null`

---

## Data branch

Run data is stored on an orphan `data` branch so it doesn't clutter `main`. It is created automatically on first deploy. To manually initialize it:

```bash
node scripts/init-data-branch.mjs
```

To inspect:

```bash
git fetch origin data:data
git show data:runs.json | jq '. | length'
```

---

## Troubleshooting

**Config validation fails:**
Run `node scripts/validate-config.mjs` locally and fix each error. The output includes the file, field path, and an actionable message.

**Dashboard shows "no data":**
The `data` branch may not exist yet. Run `node scripts/init-data-branch.mjs` or trigger a deploy — it creates the branch on first run.

**GitHub Pages not deploying:**
Check Settings → Pages → Source is set to "GitHub Actions". Check the `deploy.yml` run in the Actions tab for errors.

**Tests not tagged correctly:**
Playwright tests must be tagged `@suite_<id>` in the test name. pytest tests must use `@pytest.mark.<suite_id>`. Check the suite IDs in `config/test-suites.yml`.

**Scheduler not dispatching:**
Check `.github/workflows/scheduler.yml` is enabled (Actions tab → enable if disabled). The scheduler runs every 15 minutes — check the cron expression in your suite config.
