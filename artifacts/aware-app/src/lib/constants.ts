export const ENVS = ["QA", "UAT", "PROD"];

export const CATEGORIES = [
  "geo-match",
  "caching",
  "routing",
  "security",
  "performance",
  "tls",
  "ddos",
  "edgeworker",
  "origin-offload",
  "image-manager",
  "ion",
  "api-gateway",
  "waf",
  "bot-manager",
  "network",
  "functional",
  "smoke",
  "regression",
];

export const PRIORITIES: string[] = ["P0", "P1", "P2", "P3"];

export const SEVERITIES: string[] = ["critical", "major", "minor", "trivial"];

export const STATUSES = ["active", "disabled", "deprecated"] as const;

export const OWNERS: string[] = [];

export const TAG_COLORS: Record<string, string> = {
  geo: "#5b8af5",
  caching: "#a855f7",
  health: "#f97316",
  security: "#ef4444",
  performance: "#22c55e",
  regression: "#f59e0b",
  smoke: "#3b82f6",
  e2e: "#dc2626",
  playwright: "#1565c0",
  pytest: "#3d7ebe",
  http: "#00bcd4",
  browser: "#3b82f6",
  functional: "#ff9800",
  edgeworker: "#9c27b0",
  network: "#009688",
  waf: "#ef4444",
  "bot-manager": "#f59e0b",
  ion: "#22c55e",
  routing: "#6366f1",
};

export const CATEGORY_COLORS = [
  "#5b8af5",
  "#f97316",
  "#22c55e",
  "#ef4444",
  "#a855f7",
  "#f59e0b",
  "#3b82f6",
  "#dc2626",
  "#9aa0a6",
  "#9c27b0",
  "#009688",
  "#ff9800",
  "#78716c",
  "#6366f1",
  "#14b8a6",
  "#f43f5e",
  "#84cc16",
  "#0ea5e9",
];

export const TEST_TAGS = [
  { id: "tag_geo", name: "geo", color: "#5b8af5" },
  { id: "tag_caching", name: "caching", color: "#a855f7" },
  { id: "tag_health", name: "health", color: "#f97316" },
  { id: "tag_security", name: "security", color: "#ef4444" },
  { id: "tag_perf", name: "performance", color: "#22c55e" },
  { id: "tag_regression", name: "regression", color: "#f59e0b" },
  { id: "tag_smoke", name: "smoke", color: "#3b82f6" },
  { id: "tag_e2e", name: "e2e", color: "#dc2626" },
  { id: "tag_playwright", name: "playwright", color: "#1565c0" },
  { id: "tag_pytest", name: "pytest", color: "#3d7ebe" },
  { id: "tag_http", name: "http", color: "#00bcd4" },
  { id: "tag_browser", name: "browser", color: "#3b82f6" },
  { id: "tag_functional", name: "functional", color: "#ff9800" },
  { id: "tag_edgeworker", name: "edgeworker", color: "#9c27b0" },
  { id: "tag_network", name: "network", color: "#009688" },
  { id: "tag_waf", name: "waf", color: "#ef4444" },
  { id: "tag_ion", name: "ion", color: "#22c55e" },
  { id: "tag_routing", name: "routing", color: "#6366f1" },
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
