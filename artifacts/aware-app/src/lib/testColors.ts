export const PRI_COLORS: Record<string, string> = {
  P0: "var(--proof-red)",
  P1: "var(--proof-yellow)",
  P2: "var(--proof-blue)",
  P3: "var(--proof-text-muted)",
};

export const PRI_BGS: Record<string, string> = {
  P0: "rgba(239,68,68,0.12)",
  P1: "rgba(234,179,8,0.12)",
  P2: "rgba(59,130,246,0.12)",
  P3: "rgba(154,160,166,0.08)",
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
  web: "rgba(59,130,246,0.12)",
  api: "rgba(34,197,94,0.12)",
  http: "rgba(168,85,247,0.12)",
  edgeworker: "rgba(245,158,11,0.12)",
  transaction: "rgba(6,182,212,0.12)",
  pytest: "rgba(234,179,8,0.12)",
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
  "geo-match": "rgba(59,130,246,0.1)",
  caching: "rgba(168,85,247,0.1)",
  security: "rgba(239,68,68,0.1)",
  performance: "rgba(34,197,94,0.1)",
  functional: "rgba(245,158,11,0.1)",
  general: "rgba(154,160,166,0.1)",
  network: "rgba(6,182,212,0.1)",
  screenshots: "rgba(234,179,8,0.1)",
  "url-health": "rgba(236,72,153,0.1)",
  "edge-routing": "rgba(99,102,241,0.1)",
  "http-protocol": "rgba(20,184,166,0.1)",
};

export const STATUS_COLORS: Record<string, string> = {
  active: "var(--proof-green)",
  disabled: "var(--proof-yellow)",
  deprecated: "var(--proof-red)",
};

export const STATUS_BGS: Record<string, string> = {
  active: "rgba(34,197,94,0.12)",
  disabled: "rgba(234,179,8,0.12)",
  deprecated: "rgba(239,68,68,0.12)",
};
