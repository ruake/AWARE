import type { EnvironmentConfig } from "./types";

const LS_KEY = "proof_env_configs";

const DEFAULT_ENVIRONMENTS: EnvironmentConfig[] = [
  {
    id: "prod_prod",
    label: "Prod/Production",
    target: "Prod",
    stage: "Production",
    baseUrl: "https://www.example.com",
    ips: ["203.0.113.1", "203.0.113.2"],
    network: "production",
  },
  {
    id: "prod_staging",
    label: "Prod/Staging",
    target: "Prod",
    stage: "Staging",
    baseUrl: "https://staging.example.com",
    ips: ["198.51.100.1"],
    network: "staging",
  },
  {
    id: "uat_prod",
    label: "UAT/Production",
    target: "UAT",
    stage: "Production",
    baseUrl: "https://uat.example.com",
    ips: ["203.0.113.10"],
    network: "production",
  },
  {
    id: "uat_staging",
    label: "UAT/Staging",
    target: "UAT",
    stage: "Staging",
    baseUrl: "https://uat-staging.example.com",
    ips: ["198.51.100.10"],
    network: "staging",
  },
];

let _envConfigs: EnvironmentConfig[] | null = null;
let _listeners: Array<() => void> = [];

function loadConfigs(): EnvironmentConfig[] {
  if (_envConfigs) return _envConfigs;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      _envConfigs = JSON.parse(raw) as EnvironmentConfig[];
      return _envConfigs;
    }
  } catch { /* fall through */ }
  _envConfigs = DEFAULT_ENVIRONMENTS.map(e => ({ ...e }));
  return _envConfigs;
}

function saveConfigs(): void {
  if (!_envConfigs) return;
  localStorage.setItem(LS_KEY, JSON.stringify(_envConfigs));
}

function notify(): void {
  _listeners.forEach(cb => cb());
}

export function getEnvConfigs(): EnvironmentConfig[] {
  return loadConfigs();
}

export function getEnvLabels(): string[] {
  return loadConfigs().map(e => e.label);
}

export function getEnvConfig(label: string): EnvironmentConfig | undefined {
  return loadConfigs().find(e => e.label === label);
}

export function getEnvConfigById(id: string): EnvironmentConfig | undefined {
  return loadConfigs().find(e => e.id === id);
}

export function addEnvConfig(config: EnvironmentConfig): void {
  const configs = loadConfigs();
  if (configs.find(e => e.id === config.id)) return;
  configs.push(config);
  saveConfigs();
  notify();
}

export function updateEnvConfig(id: string, updates: Partial<EnvironmentConfig>): void {
  const configs = loadConfigs();
  const idx = configs.findIndex(e => e.id === id);
  if (idx !== -1) {
    configs[idx] = { ...configs[idx], ...updates };
    saveConfigs();
    notify();
  }
}

export function removeEnvConfig(id: string): void {
  const configs = loadConfigs();
  const idx = configs.findIndex(e => e.id === id);
  if (idx !== -1) {
    configs.splice(idx, 1);
    saveConfigs();
    notify();
  }
}

export function resetEnvConfigs(): void {
  _envConfigs = DEFAULT_ENVIRONMENTS.map(e => ({ ...e }));
  saveConfigs();
  notify();
}

export function subscribeToEnvConfigs(cb: () => void): () => void {
  _listeners.push(cb);
  return () => { _listeners = _listeners.filter(l => l !== cb); };
}
