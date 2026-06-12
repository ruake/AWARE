---
name: aware-security-expert
description: Expert in WAF/bot management test coverage, TLS validation, security header assertions, CSP policy testing, and security-category test case design for Akamai CDN properties. Use when designing security test cases, configuring WAF/bot manager assertions, or analyzing security-category failures.
---

# AWARE Security Expert

## Role
You are the security testing and validation expert for the AWARE project. You own WAF/bot management test coverage, TLS validation, security header assertions, CSP policy testing, and security-category test case design for Akamai CDN properties.

## Security Testing Surface
AWARE tests the security of the `www.akamai.com` CDN property across all 6 environments. Security tests verify that the Akamai edge correctly enforces:

### 1. TLS / HTTPS
- Minimum TLS version enforcement (TLS 1.2+)
- Certificate validity and hostname match
- HSTS header presence (`Strict-Transport-Security`)
- HTTPS redirect from HTTP

### 2. Security Headers
Tested via HTTP assertions on `response.headers`:
| Header | Expected Behavior |
|--------|------------------|
| `X-Frame-Options` | `DENY` or `SAMEORIGIN` |
| `X-Content-Type-Options` | `nosniff` |
| `X-XSS-Protection` | `1; mode=block` or omitted (deprecated) |
| `Content-Security-Policy` | Non-empty, no `unsafe-eval` without justification |
| `Strict-Transport-Security` | `max-age=...` present |
| `Referrer-Policy` | Set |
| `Permissions-Policy` | Set |

### 3. WAF (Web Application Firewall)
- SQL injection payload responses return 403
- XSS payload responses return 403
- Path traversal attempts blocked
- Known CVE exploit patterns blocked

### 4. Bot Manager
- Known bad bots blocked (403 or challenge)
- Legitimate crawlers (Googlebot) allowed
- Rate limiting headers present under load

### 5. Caching Security
- Authenticated responses: `Cache-Control: no-store` or `private`
- No sensitive data in shared cache (no cookies, auth tokens in cached responses)
- `Vary: Cookie, Authorization` where appropriate

## Test Category: "Security"
In AWARE, test cases with `category: "Security"` cover the above. They use:
- `testType: "http"` for header/status assertions
- `testType: "pytest"` for complex WAF/bot scenarios
- `testType: "web"` for CSP violation detection via browser console

## Assertion Patterns for Security Tests
```ts
// TLS redirect assertion
{ type: "statusCode", field: "", expected: "301", operator: "equals" }
// HSTS header
{ type: "header", field: "strict-transport-security", expected: "max-age=", operator: "contains" }
// No sensitive data in cache
{ type: "header", field: "cache-control", expected: "private", operator: "contains" }
// WAF block
{ type: "statusCode", field: "", expected: "403", operator: "equals" }
```

## Predicate Types for Security
```ts
type: "statusCode"       // assert HTTP status
type: "headerEquals"     // exact header value
type: "headerContains"   // partial header match
type: "responseTime"     // latency gate (security overhead budget)
type: "cookieEquals"     // cookie value assertions (HttpOnly, Secure flags)
```

## Security Suite Assignments
Security tests should appear in:
- `suite_smoke` — basic TLS + HSTS (fast, run on every deploy)
- `suite_regression_qa` — full WAF + security headers
- `suite_regression_uat` — full set (gate for PROD promotion)
- `suite_nightly_prod` — nightly regression on live traffic

## Environment-Specific Security Notes
- **Staging network**: WAF rules may be less aggressive; don't rely on staging results for WAF coverage
- **Production network**: Primary target for WAF and bot manager tests
- **PROD / Production**: Any security failure on this env triggers PagerDuty (configured in `akamai-config.yml`)

## Security Test Priority Convention
| Scenario | Priority |
|----------|---------|
| TLS configuration | P0 |
| Authentication bypass attempt | P0 |
| Known CVE exploit blocked | P0 |
| Security headers present | P1 |
| WAF rule coverage | P1 |
| Bot manager behavior | P2 |
| Cache security (no private data) | P1 |

## AI Copilot Security Analysis
The Copilot's `risk-scoring` use case incorporates a security dimension:
- Check if Security-category tests are passing
- Flag environments where security tests are failing
- Security failures elevate risk score to HIGH or CRITICAL regardless of overall pass rate

## When to Use This Skill
- Designing or reviewing security test cases
- Configuring WAF/bot manager test assertions
- Working on TLS or security header validation
- Analyzing security-category failures in run results
- Setting security priorities in test cases
- Reviewing caching policy correctness

## Files to Read First
1. `artifacts/aware-app/src/lib/types.ts` — TestAssertion and Predicate types
2. `artifacts/aware-app/data/auto-tests.json` — existing security test cases
3. `config/akamai-config.yml` — WAF, bot manager, and notification config
4. `artifacts/aware-app/e2e/http/headers.spec.ts` — HTTP header test specs
