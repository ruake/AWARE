import type { EnvironmentConfig } from "./types";

const DEFAULT_ENVIRONMENTS: EnvironmentConfig[] = [
  {
    id: "prod_prod",
    label: "Prod/Production",
    target: "Prod",
    stage: "Production",
    baseUrl: "https://the-internet.herokuapp.com",
    ips: ["3.209.172.72", "23.22.130.173"],
    network: "production",
  },
  {
    id: "prod_staging",
    label: "Prod/Staging",
    target: "Prod",
    stage: "Staging",
    baseUrl: "https://the-internet.herokuapp.com",
    ips: ["54.243.238.66"],
    network: "staging",
  },
  {
    id: "uat_prod",
    label: "UAT/Production",
    target: "UAT",
    stage: "Production",
    baseUrl: "https://the-internet.herokuapp.com",
    ips: ["107.22.57.98"],
    network: "production",
  },
  {
    id: "uat_staging",
    label: "UAT/Staging",
    target: "UAT",
    stage: "Staging",
    baseUrl: "https://the-internet.herokuapp.com",
    ips: ["3.209.172.72"],
    network: "staging",
  },
];

export function getEnvConfigs(): EnvironmentConfig[] {
  return [...DEFAULT_ENVIRONMENTS];
}

export function getEnvLabels(): string[] {
  return DEFAULT_ENVIRONMENTS.map((e) => e.label);
}

export function getEnvConfig(label: string): EnvironmentConfig | undefined {
  return DEFAULT_ENVIRONMENTS.find((e) => e.label === label);
}

export function getEnvConfigById(id: string): EnvironmentConfig | undefined {
  return DEFAULT_ENVIRONMENTS.find((e) => e.id === id);
}

export function subscribeToEnvConfigs(_cb: () => void): () => void {
  return () => {};
}
