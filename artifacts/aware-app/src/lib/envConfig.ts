import type { EnvironmentConfig } from "./types";

const DEFAULT_ENVIRONMENTS: EnvironmentConfig[] = [
  {
    id: "qa",
    label: "QA",
    target: "QA",
    stage: "QA",
    baseUrl: "https://qa.example.akamai.com",
    ips: ["23.32.11.10", "23.32.11.11"],
    network: "staging",
    property: "www.example.com",
    propertyVersion: 52,
    propertyStatus: "active",
    cpcode: "1234567",
    edgeHostname: "qa.example.com.edgekey.net",
  },
  {
    id: "uat",
    label: "UAT",
    target: "UAT",
    stage: "UAT",
    baseUrl: "https://uat.example.akamai.com",
    ips: ["23.32.22.10", "23.32.22.11"],
    network: "staging",
    property: "www.example.com",
    propertyVersion: 51,
    propertyStatus: "active",
    cpcode: "1234567",
    edgeHostname: "uat.example.com.edgekey.net",
  },
  {
    id: "prod",
    label: "PROD",
    target: "PROD",
    stage: "Production",
    baseUrl: "https://www.example.com",
    ips: ["23.32.33.10", "23.32.33.11", "23.32.33.12"],
    network: "production",
    property: "www.example.com",
    propertyVersion: 50,
    propertyStatus: "active",
    cpcode: "1234567",
    edgeHostname: "www.example.com.edgekey.net",
  },
];

let _overrides: EnvironmentConfig[] | null = null;
const _listeners: Set<() => void> = new Set();

function _load(): EnvironmentConfig[] {
  if (_overrides) return _overrides;
  try {
    const raw = localStorage.getItem("aware-env-configs-v2");
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
    localStorage.setItem("aware-env-configs-v2", JSON.stringify(configs));
  } catch {
    /* ignore */
  }
  _listeners.forEach((cb) => cb());
}

export function resetEnvConfigs(): void {
  _overrides = null;
  try {
    localStorage.removeItem("aware-env-configs-v2");
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
