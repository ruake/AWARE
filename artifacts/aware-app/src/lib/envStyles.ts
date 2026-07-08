export type EnvKey = 'QA' | 'UAT' | 'PROD';

export const ENV_BADGE_CLASS: Record<string, string> = {
  QA:   'bg-gcp-yellow/15 text-gcp-yellow-light border border-gcp-yellow/25',
  UAT:  'bg-gcp-blue/15   text-gcp-blue-light   border border-gcp-blue/25',
  PROD: 'bg-gcp-green/15  text-gcp-green-light  border border-gcp-green/25',
};

export const ENV_SELECT_CLASS: Record<string, string> = {
  QA:   'bg-gcp-blue/20   text-gcp-blue-light   border-gcp-blue/30',
  UAT:  'bg-gcp-yellow/20 text-gcp-yellow-light border-gcp-yellow/30',
  PROD: 'bg-gcp-green/20  text-gcp-green-light  border-gcp-green/30',
};

/** @deprecated Use ENV_BADGE_CLASS — identical */
export const ENV_STATUS_CLASS = ENV_BADGE_CLASS;

export function envBadgeClass(env: string): string {
  return ENV_BADGE_CLASS[env] ?? 'bg-gcp-text-muted/15 text-gcp-text-secondary border border-gcp-border/25';
}

export function envSelectClass(env: string): string {
  return ENV_SELECT_CLASS[env] ?? 'bg-gcp-text-muted/20 text-gcp-text-secondary border-gcp-text-muted/30';
}

/** @deprecated Use envBadgeClass — identical */
export const envStatusClass = envBadgeClass;

export function passRateColor(pct: number): { text: string; bar: string; glow: string } {
  if (pct >= 95) return { text: 'text-gcp-green', bar: 'bg-gcp-green', glow: 'rgba(52,168,83,0.4)' };
  if (pct >= 80) return { text: 'text-gcp-yellow', bar: 'bg-gcp-yellow', glow: 'rgba(251,188,5,0.4)' };
  return { text: 'text-gcp-red', bar: 'bg-gcp-red', glow: 'rgba(234,67,53,0.4)' };
}
