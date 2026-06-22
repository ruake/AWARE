export const PRI_COLORS: Record<string, string> = {
  P0: "var(--proof-red)",
  P1: "var(--proof-yellow)",
  P2: "var(--proof-blue)",
  P3: "var(--proof-text-muted)",
};

export const PRI_BGS: Record<string, string> = {
  P0: "var(--proof-red-bg)",
  P1: "var(--proof-yellow-bg)",
  P2: "var(--proof-blue-bg)",
  P3: "var(--proof-subtle-bg)",
};

export const TYPE_COLORS: Record<string, string> = {
  web: "var(--proof-blue)",
  api: "var(--proof-green)",
  http: "var(--proof-purple)",
  edgeworker: "var(--proof-orange)",
  transaction: "var(--proof-cyan)",
  pytest: "var(--proof-yellow)",
};

export const TYPE_BGS: Record<string, string> = {
  web: "var(--proof-blue-bg)",
  api: "var(--proof-green-bg)",
  http: "var(--proof-purple-bg)",
  edgeworker: "var(--proof-orange-bg)",
  transaction: "var(--proof-cyan-bg)",
  pytest: "var(--proof-yellow-bg)",
};

export const CAT_COLORS: Record<string, string> = {
  "geo-match": "var(--proof-blue)",
  caching: "var(--proof-purple)",
  security: "var(--proof-red)",
  performance: "var(--proof-green)",
  functional: "var(--proof-orange)",
  general: "var(--proof-text-secondary)",
  network: "var(--proof-cyan)",
  screenshots: "var(--proof-yellow)",
  "url-health": "var(--proof-pink)",
  "edge-routing": "var(--proof-indigo)",
  "http-protocol": "var(--proof-teal)",
};

export const CAT_BGS: Record<string, string> = {
  "geo-match": "var(--proof-blue-bg)",
  caching: "var(--proof-purple-bg)",
  security: "var(--proof-red-bg)",
  performance: "var(--proof-green-bg)",
  functional: "var(--proof-orange-bg)",
  general: "var(--proof-subtle-bg)",
  network: "var(--proof-cyan-bg)",
  screenshots: "var(--proof-yellow-bg)",
  "url-health": "var(--proof-pink-bg)",
  "edge-routing": "var(--proof-indigo-bg)",
  "http-protocol": "var(--proof-teal-bg)",
};

export const STATUS_COLORS: Record<string, string> = {
  active: "var(--proof-emerald)",
  disabled: "var(--proof-text-muted)",
  deprecated: "var(--proof-text-muted)",
  PASS: "var(--proof-emerald)",
  FAIL: "var(--proof-red)",
  SKIP: "var(--proof-text-muted)",
  TIMEOUT: "var(--proof-orange)",
};

export const STATUS_BGS: Record<string, string> = {
  active: "rgba(0, 220, 130, 0.1)",
  disabled: "rgba(255, 255, 255, 0.05)",
  deprecated: "rgba(255, 255, 255, 0.05)",
  PASS: "rgba(0, 220, 130, 0.1)",
  FAIL: "rgba(255, 77, 107, 0.1)",
  SKIP: "rgba(255, 255, 255, 0.05)",
  TIMEOUT: "rgba(255, 165, 0, 0.1)",
};
