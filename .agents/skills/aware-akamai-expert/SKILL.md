---
name: aware-akamai-expert
description: Expert in Akamai CDN properties, property versions, EdgeWorkers, PoP infrastructure, environment model (3 tiers x 2 networks), and the promotion gate. Use when working with PropertyStatusBar, env config, Akamai test categories, promotion flows, or akamai-config.yml.
---

# AWARE Akamai Expert

## Role
You are the Akamai CDN domain expert for the AWARE project. You understand Akamai property management, edge network concepts, EdgeWorker testing, PoP infrastructure, and how they map to the AWARE data model.

## Akamai Terminology Used in AWARE
| Term | Definition |
|------|-----------|
| **Property** | An Akamai configuration entity (e.g., `www.akamai.com`) — controls caching, routing, security |
| **Property Version** | Immutable snapshot of a property config; activated per environment tier |
| **cpcode** | Content Provider Code — billing/reporting unit in Akamai (e.g., `"1234567"`) |
| **edgeHostname** | Akamai CNAME entry (e.g., `www.akamai.com.edgekey.net`) |
| **PoP** | Point of Presence — Akamai edge server location |
| **EdgeWorker** | Serverless JS running at the Akamai edge (e.g., `locale-splitter` EW) |
| **Staging network** | Akamai's pre-production edge network — validate before activating on production |
| **Production network** | Live Akamai edge PoPs serving real user traffic |
| **Activation** | Process of pushing a property version live to a network tier |

## Environment Model (3 Tiers × 2 Networks = 6 Environments)
| ID | Label | Target | Network |
|----|-------|--------|---------|
| `qa_staging` | QA / Staging | QA | staging |
| `qa_prod` | QA / Production | QA | production |
| `uat_staging` | UAT / Staging | UAT | staging |
| `uat_prod` | UAT / Production | UAT | production |
| `prod_staging` | PROD / Staging | PROD | staging |
| `prod_prod` | PROD / Production | PROD | production |

## Active Property Versions (defaults)
| Tier | Version |
|------|---------|
| QA | 52 |
| UAT | 51 |
| PROD | 50 |

## Promotion Gate
- QA → UAT: no gate (developers promote freely)
- **UAT → PROD: requires ≥ 95% pass rate on `suite_smoke` + `suite_regression_uat`**
- Gate defined in `config/akamai-config.yml` under `properties[].promotionGate`
- Enforced via `PromotionDecision` records in the AWARE app

## PropertyStatusBar Component
- Located at `src/components/aware/PropertyStatusBar.tsx`
- Always visible on the Dashboard page
- Reads from `getEnvConfigs()` — shows property name, version, and status for all 3 tiers
- `propertyStatus` values: `"active"` | `"inactive"` | `"pending"`

## EdgeWorker Configuration
From `config/akamai-config.yml`:
```yaml
edgeworkers:
  - id: "12345"
    name: locale-splitter
    activeVersions:
      qa: "3.2.1"
      uat: "3.2.0"
      prod: "3.1.4"
```
- EdgeWorker tests use `testType: "edgeworker"` in TestCase
- EdgeWorker suites run on `suite_edgeworker` — QA + UAT staging networks only

## Test Types and Their Akamai Context
| testType | Network Layer Tested |
|----------|---------------------|
| `"http"` | Raw HTTP responses from Akamai edge (status, headers, caching) |
| `"web"` | Browser-level Playwright — full page including edge-injected behavior |
| `"pytest"` | API/scripted tests — often target Akamai edge APIs or purge endpoints |
| `"edgeworker"` | Pytest unit tests for EdgeWorker bundles |
| `"performance"` | TTFB, cache hit ratio, Ion compression savings |

## Test Categories in Akamai Context
- **Security** — WAF rules, TLS version, security headers
- **Caching** — Cache-Control, X-Check-Cacheable, cache hit ratio
- **Routing** — Geo-based routing, redirect chains, origin routing
- **Functional** — Core page functionality through the CDN
- **Performance** — TTFB, edge latency, compression (Ion/Gzip)
- **EdgeWorker** — locale-splitter logic, A/B tests at edge

## IP Testing Pattern
Each environment has specific IPs for direct-to-edge testing (bypassing DNS):
```yaml
ips: [23.32.1.10, 23.32.1.11]  # QA Staging
```
Tests that use `--resolve` or Host header overrides use these IPs.

## When to Use This Skill
- Working with PropertyStatusBar or environment config
- Adding Akamai-specific test categories or assertions
- Understanding promotion gates and deployment flows
- Configuring EdgeWorker test suites
- Working with `config/akamai-config.yml` or `config/environments.yml`
- Adding new Akamai metrics or property fields

## Files to Read First
1. `artifacts/aware-app/src/lib/envConfig.ts` — runtime environment config
2. `config/akamai-config.yml` — full property + EW + runner config
3. `config/environments.yml` — all 6 environment definitions
4. `artifacts/aware-app/src/components/aware/PropertyStatusBar.tsx` — the always-visible status component
