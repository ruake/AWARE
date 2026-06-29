import { create } from "zustand";
import { Run, TestResult, TestCase, TestSuite, SchedulerStatus } from "./types";
import { fetchAllData } from "./api";

interface AwareState {
  isLoaded: boolean;
  lastLoaded: string | null;
  runs: Run[];
  testResults: TestResult[];
  testCases: TestCase[];
  suites: TestSuite[];
  schedulerStatus: SchedulerStatus | null;
  error: string | null;

  loadData: () => Promise<void>;
  getRunById: (id: string) => Run | undefined;
  getTestResultsByRunId: (runId: string) => TestResult[];
}

export const useStore = create<AwareState>((set, get) => ({
  isLoaded: false,
  lastLoaded: null,
  runs: [],
  testResults: [],
  testCases: [],
  suites: [],
  schedulerStatus: null,
  error: null,

  loadData: async () => {
    try {
      const data = await fetchAllData();
      set({
        isLoaded: true,
        lastLoaded: new Date().toISOString(),
        runs: data.runs,
        testResults: data.testResults,
        testCases: data.testCases,
        suites: data.suites,
        schedulerStatus: data.schedulerStatus,
        error: null,
      });
    } catch (e) {
      console.error("[store] loadData failed:", e);
      set({ isLoaded: true, error: (e as Error).message });
    }
  },

  getRunById: (id: string) => {
    return get().runs.find((r) => r.id === id);
  },

  getTestResultsByRunId: (runId: string) => {
    return get().testResults.filter((r) => r.runId === runId);
  },
}));

useStore.getState().loadData();
