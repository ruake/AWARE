import type { Run, TestResult, TestCase, TestSuite, SchedulerStatus } from "./types";

const DATA_URL = "/api/data.json";

export interface AllData {
  runs: Run[];
  testResults: TestResult[];
  testCases: TestCase[];
  suites: TestSuite[];
  schedulerStatus: SchedulerStatus;
}

export async function fetchAllData(): Promise<AllData> {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Failed to load data: ${res.status} ${res.statusText}`);
  return res.json();
}
