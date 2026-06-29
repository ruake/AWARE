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

---

## FAQ

**Q: I get "contractId must start with ctr_" — where do I fix this?**

Open `config/akamai-config.yml` and update the `contractId` field under your property:
```yaml
properties:
  - name: www.example.com
    contractId: ctr_ABCDEFGH   # ← replace with your real contract ID from Akamai Control Center
```
Find it in Akamai Control Center → Properties → click your property → sidebar shows Contract ID.

---

**Q: I get "groupId must start with grp_" — where do I fix this?**

Same file, same property block:
```yaml
    groupId: grp_IJKLMNOP   # ← replace with your real group ID
```

---

**Q: I get "baseUrl must start with https://" — where do I fix this?**

Open `config/environments.yml`. Every `baseUrl` field must use `https://`:
```yaml
environments:
  - id: qa_staging
    baseUrl: https://www.example.com   # ← must be https
```

---

**Q: My CI validate-config step fails with "Unknown environment X in suite Y".**

The `envs` list in a suite (`config/test-suites.yml`) references an environment label that doesn't exist in `config/environments.yml`. Check the spelling matches exactly:
```yaml
# test-suites.yml
suites:
  - id: suite_smoke
    environments:
      - "QA / Staging"   # ← must exactly match the 'label' field in environments.yml
```

---

**Q: How do I change which Akamai property the tests run against?**

Update `config/akamai-config.yml` (property name, contractId, groupId, activeVersions) and `config/environments.yml` (baseUrl, edgeHostname, IPs). Then run `node scripts/validate-config.mjs` before pushing.

---

**Q: How do I add a new test suite?**

Add an entry to `config/test-suites.yml`:
```yaml
  - id: suite_my_new_suite
    name: My New Suite
    environments:
      - "QA / Staging"
    parallelism: 4
    retries: 1
    failFast: false
    timeoutMinutes: 15
    runners: [playwright]
    tags: [my_tag]
    schedule: "0 8 * * *"   # 08:00 UTC daily, or null to disable
```
Then tag your Playwright tests with `@suite_my_new_suite` in the test name.

---

**Q: How do I change the promotion gate threshold (currently 95%)?**

Open `config/akamai-config.yml` and update `promotionGate.minPassRate` under your property:
```yaml
    promotionGate:
      minPassRate: 90   # ← change from 95 to whatever you need
```
The same value is enforced in `.github/workflows/run-tests.yml` under the `gate-check` job — update `PASS_RATE_THRESHOLD` there too.

---

**Q: The dashboard is live but showing demo data, not my real test results.**

Real test results are written to the `data` branch by the `run-tests.yml` workflow after each CI run. Until you run actual tests, the dashboard shows the seed data from `data/`. Trigger a test run:
```bash
gh workflow run run-tests.yml --field suite=suite_smoke --field environment="QA / Staging"
```

---

**Q: I pushed but the dashboard hasn't updated.**

Check the Actions tab on GitHub:
1. Did `validate-config.yml` pass? If not, fix the config errors first.
2. Did `deploy.yml` complete? If it failed, check the logs for the specific step.
3. GitHub Pages can take 1–2 minutes to propagate after a successful deploy.

---

**Q: How do I use a self-hosted LLM (Ollama, LM Studio) with the Copilot?**

In the Copilot page, click the **gear icon** (top right). Set:
- **API URL**: your Ollama/LM Studio endpoint (e.g. `http://localhost:11434/v1`)
- **API Key**: any non-empty string (Ollama ignores it)
- **Model**: the model name (e.g. `llama3`, `mistral`)

Or use **WebLLM** mode — runs entirely in the browser, no server needed. Requires a WebGPU-capable browser (Chrome 113+).

---

**Q: How do I point the Copilot at OpenAI instead of a local model?**

In the Copilot settings panel, set:
- **API URL**: leave blank (defaults to `https://api.openai.com/v1`)
- **API Key**: your OpenAI API key (`sk-…`)
- **Model**: `gpt-4o-mini` (recommended) or `gpt-4o`

---

**Q: What is the `data` branch and can I delete it?**

The `data` branch is an orphan branch (no commit history shared with `main`) that stores live run results as JSON files. The `run-tests.yml` workflow appends to it after each CI run. The dashboard fetches from it at runtime.

**Do not delete it** once test runs are recorded — you'll lose all run history. If it was accidentally deleted, re-run the deploy workflow to recreate an empty one.

---

**Q: The `scripts/validate-config.mjs` script fails with "Cannot find module 'js-yaml'".**

Run `pnpm install` from the repo root first. The `js-yaml` dependency is declared in `scripts/package.json` and installed as part of the workspace.

---

**Q: Can I run AWARE without Akamai credentials?**

Yes — for local development and dashboard exploration, no Akamai credentials are needed. The dashboard runs entirely on seed data from `data/`. GitHub secrets are only required when running actual CDN tests via the `run-tests.yml` workflow.
