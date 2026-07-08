export interface EnvironmentConfig {
  id: string;
  label: string;
  target: string;
  network: string;
  baseUrl: string;
  ips: string[];
  active: boolean;
}

const DEFAULTS: EnvironmentConfig[] = [
  {
    id: "qa_staging",
    label: "QA / Staging",
    target: "QA",
    network: "staging",
    baseUrl: "https://qa-staging.example.com",
    ips: [],
    active: true,
  },
  {
    id: "qa_prod",
    label: "QA / Production",
    target: "QA",
    network: "production",
    baseUrl: "https://qa.example.com",
    ips: [],
    active: true,
  },
  {
    id: "uat_staging",
    label: "UAT / Staging",
    target: "UAT",
    network: "staging",
    baseUrl: "https://uat-staging.example.com",
    ips: [],
    active: true,
  },
  {
    id: "uat_prod",
    label: "UAT / Production",
    target: "UAT",
    network: "production",
    baseUrl: "https://uat.example.com",
    ips: [],
    active: true,
  },
  {
    id: "prod_staging",
    label: "PROD / Staging",
    target: "PROD",
    network: "staging",
    baseUrl: "https://prod-staging.example.com",
    ips: [],
    active: true,
  },
  {
    id: "prod_prod",
    label: "PROD / Production",
    target: "PROD",
    network: "production",
    baseUrl: "https://www.example.com",
    ips: [],
    active: true,
  },
];

const STORAGE_KEY = "aware-env-configs-v3";

let _configs: EnvironmentConfig[] = [...DEFAULTS];

export function getEnvConfigs(): EnvironmentConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      _configs = JSON.parse(stored) as EnvironmentConfig[];
    }
  } catch {
    /* noop */
  }
  return _configs;
}

export function saveEnvConfigs(configs: EnvironmentConfig[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  _configs = [...configs];
}

export function getEnvLabels(): string[] {
  return getEnvConfigs().map((e) => e.label);
}

export function getEnvConfig(label: string): EnvironmentConfig | undefined {
  return getEnvConfigs().find((e) => e.label === label);
}

export function getEnvConfigById(id: string): EnvironmentConfig | undefined {
  return getEnvConfigs().find((e) => e.id === id);
}

export function getEnvByTierAndNetwork(
  tier: string,
  network: string,
): EnvironmentConfig | undefined {
  return getEnvConfigs().find((e) => e.target === tier && e.network === network);
}

const LABEL_TO_ID: Record<string, string> = {
  "QA / Staging": "qa_staging",
  "QA / Production": "qa_prod",
  "UAT / Staging": "uat_staging",
  "UAT / Production": "uat_prod",
  "PROD / Staging": "prod_staging",
  "PROD / Production": "prod_prod",
};

const ID_TO_LABEL: Record<string, string> = {
  qa_staging: "QA / Staging",
  qa_prod: "QA / Production",
  uat_staging: "UAT / Staging",
  uat_prod: "UAT / Production",
  prod_staging: "PROD / Staging",
  prod_prod: "PROD / Production",
};

export function envIdToLabel(id: string): string {
  return ID_TO_LABEL[id] ?? id;
}

export function labelToEnvId(label: string): string | undefined {
  return LABEL_TO_ID[label];
}
