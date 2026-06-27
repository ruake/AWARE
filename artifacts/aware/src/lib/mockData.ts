import { Run, TestResult, TestCase, TestSuite, PromotionDecision, SchedulerStatus } from "./types";
import { subDays, subHours, subMinutes, subSeconds } from "date-fns";

const ENVS: { env: Run["env"]; network: Run["network"] }[] = [
  { env: "QA", network: "staging" },
  { env: "QA", network: "production" },
  { env: "UAT", network: "staging" },
  { env: "UAT", network: "production" },
  { env: "PROD", network: "staging" },
  { env: "PROD", network: "production" },
];

const CATEGORIES = ["CDN", "DNS", "TLS", "Cache", "EdgeWorker", "Redirect", "Auth"];
const TEST_TYPES = ["playwright", "pytest", "puppeteer", "http"] as const;

function generateTestCases(): TestCase[] {
  const cases: TestCase[] = [];
  for (let i = 1; i <= 50; i++) {
    cases.push({
      id: `TC-${i.toString().padStart(4, "0")}`,
      name: `Verify ${CATEGORIES[i % CATEGORIES.length]} behavior ${i}`,
      description: `Tests the primary functionality for ${CATEGORIES[i % CATEGORIES.length]} module`,
      category: CATEGORIES[i % CATEGORIES.length],
      priority: `P${i % 4}` as any,
      severity: i % 5 === 0 ? "High" : "Medium",
      status: "Active",
      owner: ["alice", "bob", "charlie", "diana"][i % 4],
      scriptPath: `/tests/${CATEGORIES[i % CATEGORIES.length].toLowerCase()}/test_${i}.py`,
      testType: TEST_TYPES[i % TEST_TYPES.length],
      tags: ["core", CATEGORIES[i % CATEGORIES.length].toLowerCase()],
      changelog: ["Initial commit", "Updated assertions"],
      updatedAt: subDays(new Date(), i % 10).toISOString(),
    });
  }
  return cases;
}

function generateSuites(testCases: TestCase[]): TestSuite[] {
  const suites: TestSuite[] = [];
  for (let i = 1; i <= 8; i++) {
    suites.push({
      id: `SUITE-${i}`,
      name: `${CATEGORIES[i % CATEGORIES.length]} Regression Suite`,
      description: `Daily regression suite for ${CATEGORIES[i % CATEGORIES.length]}`,
      testIds: testCases.slice((i - 1) * 6, i * 6).map((tc) => tc.id),
      metadata: { schedule: "0 0 * * *", parallelism: 4, environments: ["QA", "UAT", "PROD"] },
    });
  }
  return suites;
}

export function generateMockData() {
  const now = new Date();
  const testCases = generateTestCases();
  const suites = generateSuites(testCases);
  
  const runs: Run[] = [];
  const testResults: TestResult[] = [];
  
  let runCounter = 1000;
  let resultCounter = 1;

  // Generate ~30 runs over the past 30 days
  for (let day = 0; day < 30; day++) {
    for (let e = 0; e < ENVS.length; e++) {
      if (Math.random() > 0.5) continue; // Randomly skip some days/envs
      
      const isFailed = Math.random() > 0.85;
      const isRunning = day === 0 && Math.random() > 0.8;
      const status = isRunning ? "RUNNING" : isFailed ? "FAIL" : "PASS";
      const passPct = isFailed ? Math.floor(75 + Math.random() * 20) : Math.floor(95 + Math.random() * 6);
      
      const runId = `RUN-${runCounter++}`;
      const env = ENVS[e];
      const suite = suites[e % suites.length];
      
      const durationMs = 120000 + Math.floor(Math.random() * 300000);
      
      runs.push({
        id: runId,
        label: `Nightly ${env.env} ${env.network}`,
        suiteId: suite.id,
        envId: `${env.env.toLowerCase()}-${env.network}`,
        env: env.env,
        network: env.network,
        status,
        passPct: passPct > 100 ? 100 : passPct,
        failures: isFailed ? Math.floor(1 + Math.random() * 5) : 0,
        duration: `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s`,
        durationMs,
        started: subDays(subHours(now, Math.random() * 24), day).toISOString(),
        build: `v1.2.${1000 - day}`,
        rev: Math.random().toString(36).substring(2, 10),
      });

      // Generate results for this run
      const numResults = 10 + Math.floor(Math.random() * 10); // Not all test cases
      for (let r = 0; r < numResults; r++) {
        const tc = testCases[r % testCases.length];
        const isResultFailed = isFailed && r < (runs[runs.length - 1].failures);
        
        testResults.push({
          id: `RES-${resultCounter++}`,
          testCaseId: tc.id,
          runId,
          name: tc.name,
          status: isResultFailed ? "FAIL" : (Math.random() > 0.95 ? "SKIPPED" : "PASS"),
          duration: 1000 + Math.random() * 5000,
          category: tc.category,
          tags: tc.tags,
          assertions: [
            { assertion: "Status is 200", expected: "200", actual: isResultFailed ? "500" : "200", passed: !isResultFailed },
            { assertion: "Response contains data", expected: "true", actual: "true", passed: true }
          ]
        });
      }
    }
  }

  // Generate Scheduler Status
  const schedulerStatus: SchedulerStatus = {
    lastRun: subMinutes(now, 5).toISOString(),
    status: "healthy",
    summary: { totalSuites: suites.length, activeRuns: 2, pendingDispatches: 1, lastGC: subHours(now, 24).toISOString() },
    suites: suites.map(s => ({
      suiteId: s.id,
      schedule: s.metadata?.schedule || "0 * * * *",
      lastRun: subHours(now, Math.random() * 12).toISOString(),
      lastConclusion: Math.random() > 0.9 ? "FAIL" : "PASS",
      activeRuns: Math.random() > 0.8 ? 1 : 0
    })),
    recentDispatches: Array.from({length: 5}).map((_, i) => ({
      suiteId: suites[i % suites.length].id,
      environment: "QA",
      dispatchedAt: subMinutes(now, i * 15).toISOString(),
      status: i === 0 ? "failed" : "success",
      workflowRunId: 100000 + i
    }))
  };

  return { testCases, suites, runs, testResults, schedulerStatus };
}
