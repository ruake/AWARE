export const ENVS = ["QA", "UAT", "PROD"];

export const CATEGORIES = ["geo-match", "caching", "security", "edge-routing", "http-protocol"];

export const PRIORITIES: string[] = ["P0", "P1", "P2", "P3"];

export const SEVERITIES: string[] = ["critical", "major", "minor", "trivial"];

export const STATUSES = ["active", "disabled", "deprecated"] as const;

export const OWNERS: string[] = [
  "platform-eng",
  "cdn-ops",
  "security",
  "performance",
  "auto@discovery",
];

export const TAG_COLORS: Record<string, string> = {
  geo: "var(--proof-blue)",
  caching: "var(--proof-purple)",
  health: "var(--proof-orange)",
  security: "var(--proof-red)",
  performance: "var(--proof-green)",
  regression: "var(--proof-yellow)",
  smoke: "var(--proof-blue-bright)",
  e2e: "var(--proof-red-bright)",
  playwright: "var(--proof-indigo)",
  pytest: "var(--proof-teal)",
  http: "var(--proof-cyan)",
  browser: "var(--proof-blue)",
  functional: "var(--proof-orange)",
  edgeworker: "var(--proof-purple)",
  network: "var(--proof-teal)",
  waf: "var(--proof-red)",
  "bot-manager": "var(--proof-yellow)",
  ion: "var(--proof-green)",
  routing: "var(--proof-indigo)",
};

export const CATEGORY_COLORS = [
  "var(--proof-blue)",
  "var(--proof-orange)",
  "var(--proof-green)",
  "var(--proof-red)",
  "var(--proof-purple)",
  "var(--proof-yellow)",
  "var(--proof-blue-bright)",
  "var(--proof-red-bright)",
  "var(--proof-text-secondary)",
  "var(--proof-purple-bright)",
  "var(--proof-teal)",
  "var(--proof-orange-bright)",
  "var(--proof-text-muted)",
  "var(--proof-indigo)",
  "var(--proof-cyan)",
  "var(--proof-pink)",
  "var(--proof-green-bright)",
  "var(--proof-blue-bright)",
];

export const TEST_TAGS = [
  { id: "tag_geo", name: "geo", color: "var(--proof-blue)" },
  { id: "tag_caching", name: "caching", color: "var(--proof-purple)" },
  { id: "tag_health", name: "health", color: "var(--proof-orange)" },
  { id: "tag_security", name: "security", color: "var(--proof-red)" },
  { id: "tag_perf", name: "performance", color: "var(--proof-green)" },
  { id: "tag_regression", name: "regression", color: "var(--proof-yellow)" },
  { id: "tag_smoke", name: "smoke", color: "var(--proof-blue-bright)" },
  { id: "tag_e2e", name: "e2e", color: "var(--proof-red-bright)" },
  { id: "tag_playwright", name: "playwright", color: "var(--proof-indigo)" },
  { id: "tag_pytest", name: "pytest", color: "var(--proof-teal)" },
  { id: "tag_http", name: "http", color: "var(--proof-cyan)" },
  { id: "tag_browser", name: "browser", color: "var(--proof-blue)" },
  { id: "tag_functional", name: "functional", color: "var(--proof-orange)" },
  { id: "tag_edgeworker", name: "edgeworker", color: "var(--proof-purple)" },
  { id: "tag_network", name: "network", color: "var(--proof-teal)" },
  { id: "tag_waf", name: "waf", color: "var(--proof-red)" },
  { id: "tag_ion", name: "ion", color: "var(--proof-green)" },
  { id: "tag_routing", name: "routing", color: "var(--proof-indigo)" },
];

export const TEST_NAMES = [
  "Verify Geo match for /api/v1/data resolves correct PoP",
  "Check cache HIT ratio exceeds 80% on /static/* in PROD",
  "Validate EdgeWorker executes locale-split logic for fr-CA",
  "Ensure WAF blocks SQL injection on /api/v1/search",
  "Verify TLS 1.3 negotiation on all PROD edge hostnames",
  "Check Bot Manager challenge served to headless browsers",
  "Validate SureRoute path selection reduces TTFB by 15%",
  "Ensure cache MISS on POST requests to /api/v2/data",
  "Verify origin shield hit ratio exceeds 90% for /api/v3/*",
  "Check DDoS mitigation triggers at threshold",
  "Validate property version active on QA matches config",
  "Ensure cache-control headers forwarded from origin",
  "Verify IPv6 preference when client supports dual-stack",
  "Check HTTP/3 QUIC upgrade via Alt-Svc header",
  "Validate Ion compression reduces page weight by 30%",
  "Ensure API Gateway rate limiting triggers at 1000 req/min",
  "Verify Image Manager optimization serves WebP to Chrome",
  "Check custom error page on 5xx origin responses",
  "Validate EdgeWorker CPU budget stays under 50ms",
  "Ensure SXG (Signed Exchange) served to Google Bot",
  "Verify cookie forwarding rules match property config",
  "Check geo-blocking returns 403 for restricted regions",
  "Ensure HSTS header present on all PROD responses",
  "Validate mPulse RUM beacon fires on page load",
  "Check prefetch hints served via Link header on edge",
];
