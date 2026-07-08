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

export const ENV_STATUS_CLASS: Record<string, string> = {
  QA:   'bg-gcp-yellow/15 text-gcp-yellow-light border border-gcp-yellow/25',
  UAT:  'bg-gcp-blue/15   text-gcp-blue-light   border border-gcp-blue/25',
  PROD: 'bg-gcp-green/15  text-gcp-green-light  border border-gcp-green/25',
};

export function envBadgeClass(env: string): string {
  return ENV_BADGE_CLASS[env] ?? 'bg-gcp-text-muted/15 text-gcp-text-secondary border border-gcp-border/25';
}

export function envSelectClass(env: string): string {
  return ENV_SELECT_CLASS[env] ?? 'bg-gcp-text-muted/20 text-gcp-text-secondary border-gcp-text-muted/30';
}

export function envStatusClass(env: string): string {
  return ENV_STATUS_CLASS[env] ?? 'bg-gcp-text-muted/15 text-gcp-text-secondary border border-gcp-border/25';
}
