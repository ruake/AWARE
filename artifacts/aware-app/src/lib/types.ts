export type RunStatus = 'PASS' | 'FAIL' | 'PARTIAL' | 'RUNNING' | 'PENDING' | 'ERROR';
export type Env = 'QA' | 'UAT' | 'PROD';

export interface Run {
  id: string;
  label: string;
  suiteId: string;
  envId: string;
  env: Env;
  network: string;
  status: RunStatus;
  passPct: number;
  failures: number;
  duration: string;
  durationMs: number;
  started: string;
  build: string;
  rev: string;
}

export interface TestResult {
  id: string;
  testCaseId: string;
  runId: string;
  name: string;
  status: 'PASS' | 'FAIL';
  duration: number;
  category: string;
  suite: string;
  assertions: unknown[];
  evidence: {
    request: { method: string; url: string; headers: Record<string, string> };
    response: { status: number; headers: Record<string, string>; timings?: Record<string, number> };
    assertions: Array<{ label: string; pass: boolean; actual?: string; expected?: string }>;
  };
}
