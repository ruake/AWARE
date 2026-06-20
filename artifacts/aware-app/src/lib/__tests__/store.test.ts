import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadFromStorage,
  LS_TC_KEY,
  LS_SUITE_KEY,
  LS_DECISIONS_KEY,
  subscribeToTestCases,
  subscribeToTestSuites,
  _tcListeners,
  _tsListeners,
  _notifyTC,
  _notifyTS,
  _notify,
} from "../store";

beforeEach(() => {
  localStorage.clear();
  _tcListeners.clear();
  _tsListeners.clear();
});

describe("loadFromStorage", () => {
  it("returns fallback when localStorage is empty", () => {
    const fallback = [{ id: "1" }];
    const result = loadFromStorage(LS_TC_KEY, fallback);
    expect(result).toEqual(fallback);
    expect(result).not.toBe(fallback);
  });

  it("returns parsed JSON from localStorage", () => {
    const data = [{ id: "1", name: "test" }];
    localStorage.setItem(LS_TC_KEY, JSON.stringify(data));
    const result = loadFromStorage<{ id: string; name?: string }>(LS_TC_KEY, []);
    expect(result).toEqual(data);
  });

  it("returns fallback on invalid JSON", () => {
    localStorage.setItem(LS_TC_KEY, "not-valid-json");
    const fallback = [{ id: "default" }];
    const result = loadFromStorage(LS_TC_KEY, fallback);
    expect(result).toEqual(fallback);
  });

  it("returns fallback when localStorage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementationOnce(() => {
      throw new Error("storage error");
    });
    const fallback = [42];
    const result = loadFromStorage("some-key", fallback);
    expect(result).toEqual(fallback);
  });

  it("handles empty fallback array", () => {
    const result = loadFromStorage("non-existent", []);
    expect(result).toEqual([]);
  });
});

describe("LS_KEYS", () => {
  it("exports correct localStorage keys", () => {
    expect(LS_TC_KEY).toBe("aware_test_cases_v2");
    expect(LS_SUITE_KEY).toBe("aware_test_suites_v2");
    expect(LS_DECISIONS_KEY).toBe("aware_promotion_decisions");
  });
});

describe("subscribeToTestCases", () => {
  it("adds listener and returns unsubscribe function", () => {
    const fn = vi.fn();
    const unsubscribe = subscribeToTestCases(fn);
    expect(_tcListeners.has(fn)).toBe(true);

    _notifyTC();
    expect(fn).toHaveBeenCalledTimes(1);

    unsubscribe();
    expect(_tcListeners.has(fn)).toBe(false);
  });

  it("does not call other listener sets", () => {
    const tcFn = vi.fn();
    const tsFn = vi.fn();
    subscribeToTestCases(tcFn);
    subscribeToTestSuites(tsFn);

    _notifyTC();
    expect(tcFn).toHaveBeenCalledTimes(1);
    expect(tsFn).toHaveBeenCalledTimes(0);
  });
});

describe("subscribeToTestSuites", () => {
  it("adds listener and returns unsubscribe function", () => {
    const fn = vi.fn();
    const unsubscribe = subscribeToTestSuites(fn);
    expect(_tsListeners.has(fn)).toBe(true);

    _notifyTS();
    expect(fn).toHaveBeenCalledTimes(1);

    unsubscribe();
    expect(_tsListeners.has(fn)).toBe(false);
  });
});

describe("_notify", () => {
  it("notifies both TC and TS listeners", () => {
    const tcFn = vi.fn();
    const tsFn = vi.fn();
    subscribeToTestCases(tcFn);
    subscribeToTestSuites(tsFn);

    _notify();
    expect(tcFn).toHaveBeenCalledTimes(1);
    expect(tsFn).toHaveBeenCalledTimes(1);
  });

  it("handles empty listener sets without error", () => {
    expect(() => _notify()).not.toThrow();
    expect(() => _notifyTC()).not.toThrow();
    expect(() => _notifyTS()).not.toThrow();
  });

  it("multiple subscribers all get notified", () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    const fn3 = vi.fn();
    subscribeToTestCases(fn1);
    subscribeToTestCases(fn2);
    subscribeToTestCases(fn3);

    _notifyTC();
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
    expect(fn3).toHaveBeenCalledTimes(1);
  });
});
