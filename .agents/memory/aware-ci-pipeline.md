---
name: AWARE CI Pipeline
description: K8s-inspired GitHub Actions composite actions architecture, workflow files, and operator pattern.
---

## Rearchitected pipeline (K8s-inspired composite actions)

### Workflow files — `.github/workflows/`
| File | Replaces | Role |
|------|---------|------|
| `controller.yml` | scheduler.yml | CronJob reconciler — evaluates test-suites.yml and dispatches job workflows |
| `job-playwright.yml` | run-tests.yml | Pure Playwright job template |
| `job-pytest.yml` | run-tests.yml | Pure pytest job template |
| `deploy-site.yml` | deploy.yml | Build + push to site branch → GitHub Pages |
| `validate.yml` | validate-config.yml | ConfigMap validation gate on config/ changes |
| `sync-data.yml` | sync-data-branches.yml | data branch integrity / merge check |

Old files (run-tests.yml, scheduler.yml, deploy.yml, validate-config.yml, sync-data-branches.yml, test-output.yml) were stubbed with `on: {} jobs: {}` (cannot be deleted via rm in main agent — git hooks block it).

### Composite actions — `.github/actions/`
| Action | K8s analogy | Role |
|--------|------------|------|
| `aware-operator` | Operator | Run lifecycle: pending → running → done → promoted |
| `test-runner` | Pod template | Checkout tests branch, install, run Playwright or pytest |
| `data-writer` | StatefulSet | Sole authority on data branch — commits results JSON |
| `promotion-gate` | Readiness probe | Evaluates ≥95% pass rate; blocks or approves UAT→PROD |
| `setup-node` | Init container | Reusable Node 20 + pnpm bootstrap |

### CI Pipeline page (Status.tsx)
- STAGES array updated to 7 nodes: Git Push → Controller → aware-operator → test-runner → data-writer → promotion-gate → deploy-site
- Header description updated to mention composite actions + K8s analogy
- New "Composite Actions" section added (5-column card grid) between Pipeline Flow and Metrics

**Why:** The old single run-tests.yml was a monolithic 300+ line file. The new architecture decomposes into reusable composite actions (like K8s operators/pods) for better modularity, testability, and separation of concerns between test execution, data writing, and promotion decisions.
