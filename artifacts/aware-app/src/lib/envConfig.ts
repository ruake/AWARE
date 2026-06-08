import type { EnvironmentConfig } from "./types";

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

export function getEnvConfigs(): EnvironmentConfig[] {
  return [...DEFAULT_ENVIRONMENTS];
}

export function getEnvLabels(): string[] {
  return DEFAULT_ENVIRONMENTS.map(e => e.label);
}

export function getEnvConfig(label: string): EnvironmentConfig | undefined {
  return DEFAULT_ENVIRONMENTS.find(e => e.label === label);
}

export function getEnvConfigById(id: string): EnvironmentConfig | undefined {
  return DEFAULT_ENVIRONMENTS.find(e => e.id === id);
}

export function subscribeToEnvConfigs(_cb: () => void): () => void {
  return () => {};
}
