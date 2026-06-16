import { describe, it, expect, beforeEach } from "vitest";
import {
  getSelectedEnvIds,
  setSelectedEnvIds,
  toggleSelectedEnvId,
  subscribeToSelectedEnv,
  getSelectedEnvSnapshot,
} from "@/lib/selectedEnv";

beforeEach(() => {
  localStorage.clear();
  setSelectedEnvIds([]);
});

describe("selectedEnv store", () => {
  it("getSelectedEnvIds returns empty array by default", () => {
    const ids = getSelectedEnvIds();
    expect(ids).toEqual([]);
  });

  it("setSelectedEnvIds sets the env IDs", () => {
    setSelectedEnvIds(["qa_staging", "qa_prod"]);
    expect(getSelectedEnvIds()).toEqual(["qa_staging", "qa_prod"]);
  });

  it("setSelectedEnvIds persists to localStorage", () => {
    setSelectedEnvIds(["uat_staging"]);
    const raw = localStorage.getItem("aware-selected-env-v2");
    expect(JSON.parse(raw!)).toEqual(["uat_staging"]);
  });

  it("setSelectedEnvIds overwrites previous values", () => {
    setSelectedEnvIds(["qa_staging"]);
    setSelectedEnvIds(["prod_prod"]);
    expect(getSelectedEnvIds()).toEqual(["prod_prod"]);
  });

  it("setSelectedEnvIds with empty array clears selection", () => {
    setSelectedEnvIds(["qa_staging", "qa_prod"]);
    setSelectedEnvIds([]);
    expect(getSelectedEnvIds()).toEqual([]);
  });

  it("toggleSelectedEnvId adds an id not currently selected", () => {
    toggleSelectedEnvId("qa_staging");
    expect(getSelectedEnvIds()).toContain("qa_staging");
  });

  it("toggleSelectedEnvId removes an id already selected", () => {
    setSelectedEnvIds(["qa_staging", "qa_prod"]);
    toggleSelectedEnvId("qa_staging");
    expect(getSelectedEnvIds()).toEqual(["qa_prod"]);
  });

  it("toggleSelectedEnvId can add multiple ids", () => {
    toggleSelectedEnvId("qa_staging");
    toggleSelectedEnvId("uat_staging");
    toggleSelectedEnvId("prod_staging");
    expect(getSelectedEnvIds()).toEqual(["qa_staging", "uat_staging", "prod_staging"]);
  });

  it("toggleSelectedEnvId toggling same id twice returns to original", () => {
    toggleSelectedEnvId("qa_staging");
    expect(getSelectedEnvIds()).toContain("qa_staging");
    toggleSelectedEnvId("qa_staging");
    expect(getSelectedEnvIds()).not.toContain("qa_staging");
  });

  it("subscribeToSelectedEnv calls callback on setSelectedEnvIds", () => {
    const cb = vi.fn();
    const unsub = subscribeToSelectedEnv(cb);
    setSelectedEnvIds(["qa_staging"]);
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
  });

  it("subscribeToSelectedEnv calls callback on toggleSelectedEnvId", () => {
    const cb = vi.fn();
    subscribeToSelectedEnv(cb);
    toggleSelectedEnvId("qa_staging");
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("subscribeToSelectedEnv unsubscribe stops notifications", () => {
    const cb = vi.fn();
    const unsub = subscribeToSelectedEnv(cb);
    unsub();
    setSelectedEnvIds(["qa_staging"]);
    expect(cb).not.toHaveBeenCalled();
  });

  it("getSelectedEnvSnapshot returns snapshot object", () => {
    setSelectedEnvIds(["qa_staging"]);
    const snap = getSelectedEnvSnapshot();
    expect(snap).toEqual({ envIds: ["qa_staging"] });
    expect("suiteIds" in snap).toBe(false);
    expect("layout" in snap).toBe(false);
  });

  it("getSelectedEnvSnapshot returns updated values after change", () => {
    setSelectedEnvIds(["qa_staging"]);
    setSelectedEnvIds(["qa_staging", "uat_prod"]);
    const snap = getSelectedEnvSnapshot();
    expect(snap.envIds).toEqual(["qa_staging", "uat_prod"]);
  });
});
