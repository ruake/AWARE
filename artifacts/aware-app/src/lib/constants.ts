export const ENVS = ["Prod/Production", "Prod/Staging", "UAT/Production", "UAT/Staging"];

export const CATEGORIES = ["geo-match", "locale-split", "url-health", "security", "performance", "caching", "routing", "tls", "ddos"];

export const PRIORITIES: string[] = ["P0", "P1", "P2", "P3"];

export const SEVERITIES: string[] = ["critical", "major", "minor", "trivial"];

export const STATUSES = ["active", "disabled", "deprecated"] as const;

export const OWNERS = ["alice@co.com", "bob@co.com", "carol@co.com", "dave@co.com", "eve@co.com"];

export const TAG_COLORS: Record<string, string> = {
  geo: "#1a73e8", locale: "#9334e6", health: "#e8710a",
  security: "#d93025", performance: "#1e8e3e", regression: "#f9ab00",
  smoke: "#185abc", e2e: "#c5221f", automated: "#1e8e3e",
};

export const CATEGORY_COLORS = ["#1a73e8", "#e8710a", "#1e8e3e", "#d93025", "#9334e6", "#f9ab00", "#185abc", "#c5221f", "#5f6368"];

export const TEST_TAGS = [
  { id: "tag_geo", name: "geo", color: "#1a73e8" },
  { id: "tag_locale", name: "locale", color: "#9334e6" },
  { id: "tag_health", name: "health", color: "#e8710a" },
  { id: "tag_security", name: "security", color: "#d93025" },
  { id: "tag_perf", name: "performance", color: "#1e8e3e" },
  { id: "tag_regression", name: "regression", color: "#f9ab00" },
  { id: "tag_smoke", name: "smoke", color: "#185abc" },
  { id: "tag_e2e", name: "e2e", color: "#c5221f" },
];

export const TEST_NAMES = [
  "Verify Geo match for /api/v1/data resolves correct PoP",
  "Check locale split serves fr-CA content in Quebec region",
  "Validate URL health check returns 200 for /api/v2/status",
  "Ensure edge redirect preserves query params on /api/v3/data",
  "Verify cache TTL header matches origin max-age directive",
  "Check gzip compression enabled for /api/v1/assets/*",
  "Validate CORS headers present on cross-origin /api/v2/config",
  "Ensure rate limiting triggers after 100 req/min on /api/v1/auth",
  "Verify TLS 1.3 negotiation for /api/v3/secure endpoint",
  "Check WAF rules block SQL injection on /api/v1/search",
  "Validate JWT token expiry returns 401 on /api/v2/user/profile",
  "Ensure CDN purge invalidates /api/v1/cache/* within 5s",
  "Check IPv6 preference when client supports dual-stack",
  "Verify HTTP/3 (QUIC) upgrade from Alt-Svc header",
  "Validate origin shield hit ratio exceeds 80% for /api/v3/*",
  "Check mobile redirect rules for /api/v1/mobile/* paths",
  "Ensure API key rotation completes within 30s propagation",
  "Verify websocket upgrade handshake on /api/v2/ws endpoint",
  "Check custom error page served on 5xx origin responses",
  "Validate signed URL expiry enforced for /api/v1/media/*",
  "Verify SRI hash validation on injected script tags",
  "Check geo-blocking returns 403 for disallowed regions",
  "Ensure log delivery to Splunk within 60s of request",
  "Validate DDoS mitigation triggers at 10000 req/s threshold",
  "Check A/B testing cookie routing for /api/v1/experiments",
];


