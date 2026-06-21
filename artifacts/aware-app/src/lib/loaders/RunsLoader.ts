import { DataLoader } from "./base";
import { loadRuns } from "../runs";
import { bus } from "../eventBus";
import type { Run } from "../types";

export class RunsLoader extends DataLoader<Run[]> {
  constructor() {
    super({ name: "RunsLoader", required: true });
  }

  protected async doLoad(): Promise<Run[]> {
    await loadRuns();
    // In our system, loadRuns() populates the internal store.
    // We return the runs from the store for consistency.
    const { getRuns } = await import("../runs");
    return getRuns();
  }

  protected afterLoad(result: Run[]): void {
    bus.emit("runs:loaded", { count: result.length });
  }
}
