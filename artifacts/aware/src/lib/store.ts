import { create } from "zustand";
import { generateMockData } from "./mockData";
import { Run, TestResult, TestCase, TestSuite, SchedulerStatus } from "./types";

let initialData: ReturnType<typeof generateMockData>;
try {
  initialData = generateMockData();
} catch (e) {
  console.error("[store] generateMockData failed:", e);
  initialData = { runs: [], testResults: [], testCases: [], suites: [], schedulerStatus: null as any };
}

interface AwareState {
  isLoaded: boolean;
  lastLoaded: string | null;
  runs: Run[];
  testResults: TestResult[];
  testCases: TestCase[];
  suites: TestSuite[];
  schedulerStatus: SchedulerStatus | null;

  loadData: () => Promise<void>;
  getRunById: (id: string) => Run | undefined;
  getTestResultsByRunId: (runId: string) => TestResult[];
}

export const useStore = create<AwareState>((set, get) => ({
  isLoaded: true,
  lastLoaded: new Date().toISOString(),
  runs: initialData.runs,
  testResults: initialData.testResults,
  testCases: initialData.testCases,
  suites: initialData.suites,
  schedulerStatus: initialData.schedulerStatus,

  loadData: async () => {
    try {
      const mockData = generateMockData();
      set({
        isLoaded: true,
        lastLoaded: new Date().toISOString(),
        runs: mockData.runs,
        testResults: mockData.testResults,
        testCases: mockData.testCases,
        suites: mockData.suites,
        schedulerStatus: mockData.schedulerStatus,
      });
    } catch (e) {
      console.error("[store] loadData failed:", e);
    }
  },

  getRunById: (id: string) => {
    return get().runs.find((r) => r.id === id);
  },

  getTestResultsByRunId: (runId: string) => {
    return get().testResults.filter((r) => r.runId === runId);
  },
}));
