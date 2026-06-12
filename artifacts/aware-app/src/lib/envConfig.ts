import type { EnvironmentConfig } from "./types";

// Akamai uses two networks per environment tier:
//   - staging   → Akamai staging network (validate before activating)
//   - production → Akamai production (live) edge network
//
// All three tiers (QA / UAT / PROD) exist on both networks,
// giving 6 environment+network combinations.

const DEFAULT_ENVIRONMENTS: EnvironmentConfig[] = [
  // ── QA ──────────────────────────────────────────────────────────────
  {
    id: "qa_staging",
    label: "QA / Staging",
    target: "QA",
    stage: "Staging",
    baseUrl: "https://www.akamai.com",
    ips: ["23.32.1.10", "23.32.1.11"],
    network: "staging",
    property: "www.akamai.com",
    propertyVersion: 52,
    propertyStatus: "active",
    cpcode: "1234567",
    edgeHostname: "www.akamai.com.edgekey.net",
  },
  {
    id: "qa_prod",
    label: "QA / Production",
    target: "QA",
    stage: "Production",
    baseUrl: "https://www.akamai.com",
    ips: ["23.32.2.10", "23.32.2.11"],
    network: "production",
    property: "www.akamai.com",
    propertyVersion: 52,
    propertyStatus: "active",
    cpcode: "1234567",
    edgeHostname: "www.akamai.com.edgekey.net",
  },
  // ── UAT ─────────────────────────────────────────────────────────────
  {
    id: "uat_staging",
    label: "UAT / Staging",
    target: "UAT",
    stage: "Staging",
    baseUrl: "https://www.akamai.com",
    ips: ["23.32.3.10", "23.32.3.11"],
    network: "staging",
    property: "www.akamai.com",
    propertyVersion: 51,
    propertyStatus: "active",
    cpcode: "1234567",
    edgeHostname: "www.akamai.com.edgekey.net",
  },
  {
    id: "uat_prod",
    label: "UAT / Production",
    target: "UAT",
    stage: "Production",
    baseUrl: "https://www.akamai.com",
    ips: ["23.32.4.10", "23.32.4.11"],
    network: "production",
    property: "www.akamai.com",
    propertyVersion: 51,
    propertyStatus: "active",
    cpcode: "1234567",
    edgeHostname: "www.akamai.com.edgekey.net",
  },
  // ── PROD ─────────────────────────────────────────────────────────────
  {
    id: "prod_staging",
    label: "PROD / Staging",
    target: "PROD",
    stage: "Staging",
    baseUrl: "https://www.akamai.com",
    ips: ["23.32.5.10", "23.32.5.11", "23.32.5.12"],
    network: "staging",
    property: "www.akamai.com",
    propertyVersion: 50,
    propertyStatus: "active",
    cpcode: "1234567",
    edgeHostname: "www.akamai.com.edgekey.net",
  },
  {
    id: "prod_prod",
    label: "PROD / Production",
    target: "PROD",
    stage: "Production",
    baseUrl: "https://www.akamai.com",
    ips: ["23.32.6.10", "23.32.6.11", "23.32.6.12"],
    network: "production",
    property: "www.akamai.com",
    propertyVersion: 50,
    propertyStatus: "active",
    cpcode: "1234567",
    edgeHostname: "www.akamai.com.edgekey.net",
  },
];

let _overrides: EnvironmentConfig[] | null = null;
const _listeners: Set<() => void> = new Set();

function _load(): EnvironmentConfig[] {
  if (_overrides) return _overrides;
  try {
    const raw = localStorage.getItem("aware-env-configs-v3");
    if (raw) {
      const parsed = JSON.parse(raw) as EnvironmentConfig[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_ENVIRONMENTS;
}

export function getEnvConfigs(): EnvironmentConfig[] {
  return _load();
}

export function saveEnvConfigs(configs: EnvironmentConfig[]): void {
  _overrides = configs;
  try {
    localStorage.setItem("aware-env-configs-v3", JSON.stringify(configs));
  } catch {
    /* ignore */
  }
  _listeners.forEach((cb) => cb());
}

export function resetEnvConfigs(): void {
  _overrides = null;
  try {
    localStorage.removeItem("aware-env-configs-v3");
  } catch {
    /* ignore */
  }
  _listeners.forEach((cb) => cb());
}

export function getEnvLabels(): string[] {
  return _load().map((e) => e.label);
}

export function getEnvConfig(label: string): EnvironmentConfig | undefined {
  return _load().find((e) => e.label === label);
}

export function getEnvConfigById(id: string): EnvironmentConfig | undefined {
  return _load().find((e) => e.id === id);
}

export function subscribeToEnvConfigs(cb: () => void): () => void {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}

export { DEFAULT_ENVIRONMENTS };
