import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DataInitState } from "../initData";

vi.mock("../eventBus", () => ({
  bus: { emit: vi.fn() },
}));

vi.mock("./ai/debugLogger", () => ({
  logError: vi.fn(),
}));

const mockLoadRuns = vi.hoisted(() => vi.fn());
const mockLoadDiffRows = vi.hoisted(() => vi.fn());
const mockLoadTestSuites = vi.hoisted(() => vi.fn());
const mockLoadPromotions = vi.hoisted(() => vi.fn());
const mockLoadSchedulerStatus = vi.hoisted(() => vi.fn());
const mockLoadAutoDiscoveredTests = vi.hoisted(() => vi.fn());
const mockLoadAllResults = vi.hoisted(() => vi.fn());
const mockRecomputeAll = vi.hoisted(() => vi.fn());

vi.mock("../runs", () => ({
  loadRuns: mockLoadRuns,
  loadDiffRows: mockLoadDiffRows,
  recomputeAll: mockRecomputeAll,
}));

vi.mock("../runsLoader", () => ({
  loadAllResults: mockLoadAllResults,
}));

vi.mock("../testSuites", () => ({
  loadTestSuites: mockLoadTestSuites,
}));

vi.mock("../promotions", () => ({
  loadPromotions: mockLoadPromotions,
}));

vi.mock("../schedulerStatus", () => ({
  loadSchedulerStatus: mockLoadSchedulerStatus,
}));

vi.mock("../testDiscovery", () => ({
  loadAutoDiscoveredTests: mockLoadAutoDiscoveredTests,
}));

let loadAllData: () => Promise<void>;
let getDataInitState: () => DataInitState;

describe("initData integration", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const mod = await import("../initData");
    loadAllData = mod.loadAllData;
    getDataInitState = mod.getDataInitState;

    mockLoadRuns.mockResolvedValue(undefined);
    mockLoadDiffRows.mockResolvedValue(undefined);
    mockLoadTestSuites.mockResolvedValue(undefined);
    mockLoadPromotions.mockResolvedValue(undefined);
    mockLoadSchedulerStatus.mockResolvedValue(undefined);
    mockLoadAutoDiscoveredTests.mockResolvedValue(undefined);
    mockLoadAllResults.mockResolvedValue(undefined);
    mockRecomputeAll.mockReturnValue(undefined);
  });

  it("should complete all phases and set loaded=true", async () => {
    expect(getDataInitState().loaded).toBe(false);
    await loadAllData();
    const state = getDataInitState();
    expect(state.loaded).toBe(true);
    expect(state.loading).toBe(false);
    expect(state.runsReady).toBe(true);
    expect(state.suitesReady).toBe(true);
    expect(state.promotionsReady).toBe(true);
    expect(state.schedulerReady).toBe(true);
    expect(state.discoveryReady).toBe(true);
    expect(state.resultsReady).toBe(true);
    expect(state.error).toBeNull();
  });

  it("should sequence phases: runs ready before suites ready", async () => {
    let runsCompleted = false;
    mockLoadRuns.mockImplementation(async () => {
      runsCompleted = true;
    });
    mockLoadTestSuites.mockImplementation(async () => {
      expect(runsCompleted).toBe(true);
    });

    await loadAllData();
    const state = getDataInitState();
    expect(state.runsReady).toBe(true);
    expect(state.suitesReady).toBe(true);
  });

  it("should set results ready last (phase 3)", async () => {
    let suitesCompleted = false;
    mockLoadTestSuites.mockImplementation(async () => {
      suitesCompleted = true;
    });
    mockLoadAllResults.mockImplementation(async () => {
      expect(suitesCompleted).toBe(true);
    });

    await loadAllData();
    const state = getDataInitState();
    expect(state.resultsReady).toBe(true);
  });

  it("should collect errors without blocking subsequent phases", async () => {
    mockLoadRuns.mockRejectedValue(new Error("runs network error"));
    mockLoadTestSuites.mockRejectedValue(new Error("suites parse error"));
    mockLoadPromotions.mockResolvedValue(undefined);
    mockLoadSchedulerStatus.mockResolvedValue(undefined);
    mockLoadAutoDiscoveredTests.mockResolvedValue(undefined);
    mockLoadAllResults.mockResolvedValue(undefined);

    await loadAllData();
    const state = getDataInitState();
    expect(state.loaded).toBe(true);
    expect(state.runsReady).toBe(true);
    expect(state.suitesReady).toBe(true);
    expect(state.resultsReady).toBe(true);
    expect(state.error).not.toBeNull();
    expect(String(state.error)).toContain("runs network error");
    expect(String(state.error)).toContain("suites parse error");
  });

  it("should complete when an optional phase loader fails", async () => {
    mockLoadDiffRows.mockRejectedValue(new Error("diff failed"));

    await loadAllData();
    const state = getDataInitState();
    expect(state.loaded).toBe(true);
    expect(state.runsReady).toBe(true);
    expect(state.resultsReady).toBe(true);
  });

  it("should be idempotent — second call returns immediately", async () => {
    await loadAllData();
    expect(mockLoadRuns).toHaveBeenCalledTimes(1);
    mockLoadRuns.mockClear();

    await loadAllData();
    expect(mockLoadRuns).not.toHaveBeenCalled();
    expect(getDataInitState().loaded).toBe(true);
  });
});
