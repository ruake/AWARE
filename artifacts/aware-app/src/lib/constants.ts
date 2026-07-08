export const APP_NAME = 'A.W.A.R.E.';
export const APP_TAGLINE = 'Akamai Web Analytics Regression Engine';
export const APP_VERSION = '2.0.0';

export const ENV_COLOR_MAP: Record<string, string> = {
  QA:   'bg-gcp-yellow/15 text-gcp-yellow-light border border-gcp-yellow/25',
  UAT:  'bg-gcp-blue/15 text-gcp-blue-light border border-gcp-blue/25',
  PROD: 'bg-gcp-green/15 text-gcp-green-light border border-gcp-green/25',
};

export const ENV_LABELS: Record<string, string> = {
  QA:   'QA',
  UAT:  'UAT',
  PROD: 'PROD',
};

export const STATUS_CONFIG = {
  PASS:    { label: 'Pass', bg: 'bg-gcp-green', color: 'text-white' },
  FAIL:    { label: 'Fail', bg: 'bg-gcp-red',   color: 'text-white' },
  PARTIAL: { label: 'Partial', bg: 'bg-gcp-yellow', color: 'text-black' },
  RUNNING: { label: 'Running', bg: 'bg-gcp-blue',  color: 'text-white' },
  PENDING: { label: 'Pending', bg: 'bg-gcp-text-muted', color: 'text-white' },
  ERROR:   { label: 'Error', bg: 'bg-gcp-red', color: 'text-white' },
} as const;

export const PAGE_SIZE = 50;
