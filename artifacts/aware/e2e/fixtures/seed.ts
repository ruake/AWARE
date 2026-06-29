export interface SeedRun {
  id: string; label: string; suiteId: string; envId: string;
  env: string; network: string; status: string;
  passPct: number; failures: number; duration: string; durationMs: number;
  started: string; build: string; rev: string;
}

export interface SeedTestResult {
  id: string; testCaseId: string; runId: string; name: string;
  status: string; duration: number; category: string;
  tags?: string[]; error?: string; flaky?: boolean; retryCount?: number; started?: string;
  assertions?: { assertion: string; expected: string; actual: string; passed: boolean }[];
}

export interface SeedTestCase {
  id: string; name: string; description: string; category: string;
  priority: string; severity: string; status: string;
  owner: string; scriptPath: string; testType: string;
  tags: string[]; changelog: string[]; updatedAt: string;
  assertions?: string[]; githubPath?: string;
}

export interface SeedTestSuite {
  id: string; name: string; description: string; parentId?: string;
  testIds: string[];
  metadata?: { schedule?: string; parallelism?: number; environments?: string[]; timeoutMinutes?: number; runners?: string[]; tags?: string[]; };
}

export interface SeedSchedulerStatus {
  lastRun: string; status: string;
  suites: { suiteId: string; schedule: string; lastRun: string | null; lastConclusion: string | null; activeRuns: number }[];
  recentDispatches: { suiteId: string; environment: string; dispatchedAt: string; status: string; workflowRunId: number }[];
  summary: { totalSuites: number; activeRuns: number; pendingDispatches: number; lastGC: string | null };
}

export interface SeedData {
  runs: SeedRun[];
  testResults: SeedTestResult[];
  testCases: SeedTestCase[];
  suites: SeedTestSuite[];
  schedulerStatus: SeedSchedulerStatus;
}

function makePrng(seed: number) {
  let s = seed >>> 0;
  return () => { s = Math.imul(1664525, s) + 1013904223; return (s >>> 0) / 4294967295; };
}
const rand = makePrng(0xdeadbeef);
function ri(min: number, max: number) { return min + Math.floor(rand() * (max - min + 1)); }
const CATEGORIES = ["CDN", "DNS", "TLS", "Cache", "EdgeWorker", "Redirect", "Auth"] as const;
const TEST_TYPES  = ["playwright", "pytest", "puppeteer", "http"] as const;
const OWNERS      = ["alice", "bob", "charlie", "diana"];
const ENVS: Array<{ env: string; network: string }> = [
  { env: "QA",   network: "staging"    }, { env: "QA",   network: "production" },
  { env: "UAT",  network: "staging"    }, { env: "UAT",  network: "production" },
  { env: "PROD", network: "staging"    }, { env: "PROD", network: "production" },
];

function daysAgo(d: number, hoursOffset = 0): string {
  const t = new Date(); t.setDate(t.getDate() - d); t.setHours(t.getHours() - hoursOffset); return t.toISOString();
}
function minsAgo(m: number): string { return new Date(Date.now() - m * 60000).toISOString(); }
function msToHuman(ms: number): string { return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`; }

export function generateSeedData(): SeedData {
  const testCases: SeedTestCase[] = [];
  for (let i = 0; i < 50; i++) {
    const cat = CATEGORIES[i % CATEGORIES.length];
    testCases.push({
      id: `TC-${String(i + 1).padStart(4, "0")}`, name: `Verify ${cat} behavior ${i + 1}`,
      description: `Tests the primary functionality for the ${cat} module (case ${i + 1})`,
      category: cat, priority: `P${i % 4}`, severity: i % 5 === 0 ? "critical" : "major",
      status: "active", owner: OWNERS[i % OWNERS.length],
      scriptPath: `/tests/${cat.toLowerCase()}/test_${i + 1}.${i % 2 === 0 ? "py" : "spec.ts"}`,
      testType: TEST_TYPES[i % TEST_TYPES.length],
      tags: ["core", cat.toLowerCase()],
      assertions: [`HTTP 200 on ${cat} endpoint`, `Response schema valid`],
      changelog: ["Initial commit", "Updated assertions v2"],
      updatedAt: daysAgo(i % 10),
      githubPath: `https://github.com/example/repo/blob/main/tests/${cat.toLowerCase()}/test_${i + 1}.py`,
    });
  }

  const suites: SeedTestSuite[] = Array.from({ length: 8 }, (_, i) => ({
    id: `SUITE-${i + 1}`, name: `${CATEGORIES[i % CATEGORIES.length]} Regression Suite`,
    description: `Daily regression suite for ${CATEGORIES[i % CATEGORIES.length]}`,
    testIds: testCases.slice(i * 6, (i + 1) * 6).map(tc => tc.id),
    metadata: { schedule: "0 0 * * *", parallelism: 4, timeoutMinutes: 30, environments: ["QA", "UAT", "PROD"], runners: ["playwright", "pytest"], tags: [CATEGORIES[i % CATEGORIES.length].toLowerCase()] },
  }));

  const runs: SeedRun[] = [];
  const testResults: SeedTestResult[] = [];
  let runIdx = 1000, resultIdx = 10000;

  const anchorSpecs = [
    { env: "QA", network: "staging", status: "PASS", passPct: 98, failures: 0, daysBack: 0 },
    { env: "QA", network: "staging", status: "FAIL", passPct: 80, failures: 4, daysBack: 1 },
    { env: "UAT", network: "staging", status: "PASS", passPct: 97, failures: 0, daysBack: 0 },
    { env: "UAT", network: "production", status: "FAIL", passPct: 76, failures: 5, daysBack: 1 },
    { env: "PROD", network: "staging", status: "PASS", passPct: 99, failures: 0, daysBack: 2 },
    { env: "PROD", network: "production", status: "PASS", passPct: 95, failures: 0, daysBack: 3 },
  ];

  for (const spec of anchorSpecs) {
    const runId = `RUN-${runIdx++}`;
    const suite = suites[runs.length % suites.length];
    const durationMs = 140000 + runs.length * 13000;
    runs.push({
      id: runId, label: `Nightly ${spec.env} ${spec.network}`, suiteId: suite.id,
      envId: `${spec.env.toLowerCase()}_${spec.network}`, env: spec.env, network: spec.network,
      status: spec.status, passPct: spec.passPct, failures: spec.failures,
      duration: msToHuman(durationMs), durationMs, started: daysAgo(spec.daysBack, runs.length % 4),
      build: `v1.2.${1000 - runs.length}`, rev: `abc${String(runIdx).padStart(5, "0")}`,
    });
    for (let r = 0; r < 20; r++) {
      const tc = testCases[r % testCases.length];
      const isFail = spec.status === "FAIL" && r < spec.failures;
      const resultStatus = isFail ? "FAIL" : r === 19 ? "SKIPPED" : "PASS";
      testResults.push({
        id: `RES-${resultIdx++}`, testCaseId: tc.id, runId, name: tc.name,
        status: resultStatus, duration: Math.round(1200 + (r * 173 + 89) % 4800), category: tc.category,
        tags: tc.tags, flaky: false, retryCount: 0, started: daysAgo(0, r % 12),
        assertions: [
          { assertion: `HTTP 200 on ${tc.category} endpoint`, expected: "200", actual: isFail ? "503" : "200", passed: !isFail },
          { assertion: "Response schema is valid", expected: "true", actual: "true", passed: true },
          { assertion: "Response time < 2000ms", expected: "< 2000", actual: isFail ? "4521" : String(Math.round(300 + (r * 37) % 700)), passed: !isFail },
        ],
        error: isFail ? `AssertionError: expected HTTP 200 but got 503 at ${tc.scriptPath}:${r + 10}` : undefined,
      });
    }
  }

  for (let day = 0; day < 30; day++) {
    for (let ei = 0; ei < ENVS.length; ei++) {
      if ((day * ENVS.length + ei) % 5 === 3) continue;
      const isFailed = (day * 7 + ei) % 11 === 0;
      const isRunning = day === 0 && ei === 2;
      const status = isRunning ? "RUNNING" : isFailed ? "FAIL" : "PASS";
      const passPct = isFailed ? 75 + ((day * ei + 7) % 20) : 95 + ((day + ei) % 6);
      const failures = isFailed ? 1 + ((day + ei) % 5) : 0;
      const runId = `RUN-${runIdx++}`;
      const envSpec = ENVS[ei];
      const suite = suites[(day + ei) % suites.length];
      const durationMs = 120000 + ((day * 13 + ei * 17) % 300000);
      runs.push({
        id: runId, label: `Nightly ${envSpec.env} ${envSpec.network} d${day}`, suiteId: suite.id,
        envId: `${envSpec.env.toLowerCase()}_${envSpec.network}`, env: envSpec.env, network: envSpec.network,
        status, passPct, failures, duration: msToHuman(durationMs), durationMs,
        started: daysAgo(day, (day * ei) % 20), build: `v1.2.${1000 - day}`,
        rev: `${String(runIdx).padStart(6, "0").slice(0, 8)}`,
      });
      for (let r = 0; r < 20; r++) {
        const tc = testCases[r % testCases.length];
        const isFail = status === "FAIL" && r < failures;
        const resultStatus = isFail ? "FAIL" : r === 19 ? "SKIPPED" : "PASS";
        testResults.push({
          id: `RES-${resultIdx++}`, testCaseId: tc.id, runId, name: tc.name,
          status: resultStatus, duration: Math.round(1200 + (r * 173 + 89) % 4800), category: tc.category,
          tags: tc.tags, flaky: false, retryCount: 0, started: daysAgo(0, r % 12),
          assertions: [
            { assertion: `HTTP 200 on ${tc.category} endpoint`, expected: "200", actual: isFail ? "503" : "200", passed: !isFail },
            { assertion: "Response schema is valid", expected: "true", actual: "true", passed: true },
            { assertion: "Response time < 2000ms", expected: "< 2000", actual: isFail ? "4521" : String(Math.round(300 + (r * 37) % 700)), passed: !isFail },
          ],
          error: isFail ? `AssertionError: expected HTTP 200 but got 503 at ${tc.scriptPath}:${r + 10}` : undefined,
        });
      }
    }
  }

  const schedulerStatus: SeedSchedulerStatus = {
    lastRun: minsAgo(5), status: "healthy",
    summary: { totalSuites: suites.length, activeRuns: 2, pendingDispatches: 1, lastGC: daysAgo(1) },
    suites: suites.map((s, i) => ({
      suiteId: s.id, schedule: s.metadata?.schedule ?? "0 * * * *",
      lastRun: minsAgo(i * 60 + 10), lastConclusion: i % 7 === 0 ? "FAIL" : "PASS",
      activeRuns: i % 4 === 0 ? 1 : 0,
    })),
    recentDispatches: Array.from({ length: 10 }, (_, i) => ({
      suiteId: suites[i % suites.length].id, environment: ENVS[i % ENVS.length].env,
      dispatchedAt: minsAgo(i * 15 + 2), status: i === 0 ? "failed" : "success", workflowRunId: 100000 + i,
    })),
  };

  return { testCases, suites, runs, testResults, schedulerStatus };
}
