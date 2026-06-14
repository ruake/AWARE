import type { EnvironmentConfig } from "./types";
import type { AkamaiEnvId, AkamaiTier, AkamaiNetwork } from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// SOURCE OF TRUTH: config/environments.yml
//
// The environment definitions below are DUPLICATED from the YAML config for
// build-time efficiency (the YAML is only available server-side / in CI).
//
// If you add, remove, or rename an environment, you MUST update BOTH:
//   1. config/environments.yml  ← source of truth
//   2. this ENV_CONFIGS array     ← TypeScript mirror
//
// The validate-config.mjs script cross-references both files and will fail
// the build if they diverge.  Run: node scripts/validate-config.mjs
// ═══════════════════════════════════════════════════════════════════════════
//
// Akamai uses two networks per environment tier:
//   - staging   → Akamai staging network (validate before activating)
//   - production → Akamai production (live) edge network
//
// All three tiers (QA / UAT / PROD) exist on both networks,
// giving 6 environment+network combinations.
//
// This config is read-only — the site is static and no environment
// configuration is mutable from the UI.

export const ENV_CONFIGS: EnvironmentConfig[] = [
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

export function getEnvConfigs(): EnvironmentConfig[] {
  return ENV_CONFIGS;
}

export function getEnvLabels(): string[] {
  return ENV_CONFIGS.map((e) => e.label);
}

export function getEnvConfig(label: string): EnvironmentConfig | undefined {
  return ENV_CONFIGS.find((e) => e.label === label);
}

export function getEnvConfigById(id: string): EnvironmentConfig | undefined {
  return ENV_CONFIGS.find((e) => e.id === id);
}

export function getEnvByTierAndNetwork(
  tier: AkamaiTier,
  network: AkamaiNetwork,
): EnvironmentConfig | undefined {
  return ENV_CONFIGS.find((e) => e.target === tier && e.network === network);
}

export function envIdToLabel(envId: AkamaiEnvId): string {
  return ENV_CONFIGS.find((e) => e.id === envId)?.label ?? envId;
}

export function labelToEnvId(label: string): AkamaiEnvId | undefined {
  return ENV_CONFIGS.find((e) => e.label === label)?.id as AkamaiEnvId | undefined;
}

export { ENV_CONFIGS as DEFAULT_ENVIRONMENTS };
