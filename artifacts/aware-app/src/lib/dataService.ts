import type { EnvSummaryEntry } from "./runs";
import {
  getRuns,
  getRunById,
  subscribeToRuns,
  getEnvSummary,
  getDiffRows,
  getTestResultsForRun,
} from "./runs";
import type { Run, TestResult, DiffRow } from "./types";

export class DataService {
  private static _instance: DataService | null = null;

  private constructor() {}

  static get instance(): DataService {
    if (!this._instance) {
      this._instance = new DataService();
    }
    return this._instance;
  }

  // runs
  getRuns(filter?: (r: Run) => boolean): readonly Run[] {
    const runs = getRuns();
    return filter ? runs.filter(filter) : runs;
  }

  getRunById(id: string): Run | undefined {
    return getRunById(id);
  }

  subscribeToRuns(cb: () => void): () => void {
    return subscribeToRuns(cb);
  }

  // test results
  getResultsForRun(runId: string): TestResult[] {
    return getTestResultsForRun(runId);
  }

  // env summary
  getEnvSummary(): readonly EnvSummaryEntry[] {
    return getEnvSummary();
  }

  // diff rows
  getDiffRows(): readonly DiffRow[] {
    return getDiffRows();
  }
}
