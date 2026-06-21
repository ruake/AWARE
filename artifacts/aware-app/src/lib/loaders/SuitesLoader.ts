import { DataLoader } from "./base";
import { loadTestSuites } from "../testSuites";
import type { TestSuite } from "../types";

export class SuitesLoader extends DataLoader<TestSuite[]> {
  constructor() {
    super({ name: "SuitesLoader", required: false });
  }

  protected async doLoad(): Promise<TestSuite[]> {
    await loadTestSuites();
    const { getTestSuites } = await import("../testSuites");
    return getTestSuites();
  }
}
