import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getSelectedEnvIds,
  setSelectedEnvIds,
  getSelectedSuiteIds,
  setSelectedSuiteIds,
  toggleSelectedSuiteId,
  subscribeToSelectedSuites,
  getSelectedSuiteSnapshot,
  subscribeToFilters,
  getLayoutSettings,
  getLayoutSnapshot,
  setLayoutSettings,
  subscribeToLayout,
} from "@/lib/filters";

beforeEach(() => {
  localStorage.clear();
  setSelectedSuiteIds([]);
  setLayoutSettings({
    sidebarWidth: 240,
    detailPanelWidth: 380,
    chartPanelCollapsed: false,
    sidebarCollapsed: false,
    testDetailPanelCollapsed: false,
    envHealthCollapsed: false,
  });
});

describe("Suite filter store", () => {
  it("getSelectedSuiteIds returns empty array by default", () => {
    expect(getSelectedSuiteIds()).toEqual([]);
  });

  it("setSelectedSuiteIds updates the suite IDs", () => {
    setSelectedSuiteIds(["suite_smoke", "suite_regression"]);
    expect(getSelectedSuiteIds()).toEqual(["suite_smoke", "suite_regression"]);
  });

  it("setSelectedSuiteIds persists to localStorage", () => {
    setSelectedSuiteIds(["suite_smoke"]);
    const raw = localStorage.getItem("aware-selected-suites-v1");
    expect(JSON.parse(raw!)).toEqual(["suite_smoke"]);
  });

  it("setSelectedSuiteIds overwrites previous values", () => {
    setSelectedSuiteIds(["suite_smoke"]);
    setSelectedSuiteIds(["suite_regression"]);
    expect(getSelectedSuiteIds()).toEqual(["suite_regression"]);
  });

  it("setSelectedSuiteIds with empty array clears selection", () => {
    setSelectedSuiteIds(["suite_smoke"]);
    setSelectedSuiteIds([]);
    expect(getSelectedSuiteIds()).toEqual([]);
  });

  it("toggleSelectedSuiteId adds an id not currently selected", () => {
    toggleSelectedSuiteId("suite_smoke");
    expect(getSelectedSuiteIds()).toContain("suite_smoke");
  });

  it("toggleSelectedSuiteId removes an id already selected", () => {
    setSelectedSuiteIds(["suite_smoke", "suite_regression"]);
    toggleSelectedSuiteId("suite_smoke");
    expect(getSelectedSuiteIds()).toEqual(["suite_regression"]);
  });

  it("toggling same id twice returns to original state", () => {
    toggleSelectedSuiteId("suite_smoke");
    toggleSelectedSuiteId("suite_smoke");
    expect(getSelectedSuiteIds()).not.toContain("suite_smoke");
  });

  it("subscribeToSelectedSuites fires on setSelectedSuiteIds", () => {
    const cb = vi.fn();
    const unsub = subscribeToSelectedSuites(cb);
    setSelectedSuiteIds(["suite_smoke"]);
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
  });

  it("subscribeToSelectedSuites fires on toggleSelectedSuiteId", () => {
    const cb = vi.fn();
    subscribeToSelectedSuites(cb);
    toggleSelectedSuiteId("suite_smoke");
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("subscribeToSelectedSuites unsubscribe stops notifications", () => {
    const cb = vi.fn();
    const unsub = subscribeToSelectedSuites(cb);
    unsub();
    setSelectedSuiteIds(["suite_smoke"]);
    expect(cb).not.toHaveBeenCalled();
  });

  it("getSelectedSuiteSnapshot returns stable snapshot object", () => {
    setSelectedSuiteIds(["suite_smoke"]);
    const snap = getSelectedSuiteSnapshot();
    expect(snap).toEqual({ suiteIds: ["suite_smoke"] });
  });
});

describe("subscribeToFilters (combined)", () => {
  it("fires when env IDs change", () => {
    const cb = vi.fn();
    const unsub = subscribeToFilters(cb);
    setSelectedEnvIds(["qa_staging"]);
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
  });

  it("fires when suite IDs change", () => {
    const cb = vi.fn();
    const unsub = subscribeToFilters(cb);
    setSelectedSuiteIds(["suite_smoke"]);
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
  });

  it("unsubscribes from both env and suite changes", () => {
    const cb = vi.fn();
    const unsub = subscribeToFilters(cb);
    unsub();
    setSelectedEnvIds(["qa_staging"]);
    setSelectedSuiteIds(["suite_smoke"]);
    expect(cb).not.toHaveBeenCalled();
  });
});

describe("Layout settings store", () => {
  it("getLayoutSettings returns defaults", () => {
    const layout = getLayoutSettings();
    expect(layout.sidebarWidth).toBe(240);
    expect(layout.detailPanelWidth).toBe(380);
    expect(layout.chartPanelCollapsed).toBe(false);
    expect(layout.sidebarCollapsed).toBe(false);
    expect(layout.testDetailPanelCollapsed).toBe(false);
    expect(layout.envHealthCollapsed).toBe(false);
  });

  it("setLayoutSettings merges partial updates", () => {
    setLayoutSettings({ sidebarWidth: 320 });
    const layout = getLayoutSettings();
    expect(layout.sidebarWidth).toBe(320);
    expect(layout.detailPanelWidth).toBe(380);
  });

  it("setLayoutSettings persists to localStorage", () => {
    setLayoutSettings({ chartPanelCollapsed: true });
    const raw = localStorage.getItem("aware-layout-v1");
    const stored = JSON.parse(raw!);
    expect(stored.chartPanelCollapsed).toBe(true);
  });

  it("setLayoutSettings updates multiple fields at once", () => {
    setLayoutSettings({ sidebarCollapsed: true, testDetailPanelCollapsed: true });
    const layout = getLayoutSettings();
    expect(layout.sidebarCollapsed).toBe(true);
    expect(layout.testDetailPanelCollapsed).toBe(true);
  });

  it("getLayoutSnapshot mirrors getLayoutSettings", () => {
    setLayoutSettings({ detailPanelWidth: 500 });
    expect(getLayoutSnapshot().detailPanelWidth).toBe(500);
  });

  it("subscribeToLayout fires on setLayoutSettings", () => {
    const cb = vi.fn();
    const unsub = subscribeToLayout(cb);
    setLayoutSettings({ sidebarWidth: 260 });
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
  });
});
