import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const mockNavigate = vi.fn();
vi.mock("wouter", () => ({
  useLocation: vi.fn(() => ["/", mockNavigate]),
  Link: vi.fn(({ children, ...props }: any) => <a {...props}>{children}</a>),
  Route: vi.fn(({ children }: any) => <>{children}</>),
}));

const mockSetBaseline = vi.fn();
const mockSetCandidate = vi.fn();
const mockSetSearchText = vi.fn();
const mockSetActiveFilter = vi.fn();

const mockUseSyncedUrlState = vi.fn((key: string, def: string) => {
  if (key === "baseline") return ["run_base-001", mockSetBaseline];
  if (key === "candidate") return ["run_cand-002", mockSetCandidate];
  if (key === "q") return ["", mockSetSearchText];
  if (key === "filter") return [null, mockSetActiveFilter];
  return [def, vi.fn()];
});

vi.mock("@/lib/urlState", () => ({
  useSyncedUrlState: mockUseSyncedUrlState,
}));

const mockGetDataInitState = vi.fn();
const mockSubscribeToDataInit = vi.fn(() => vi.fn());
const mockGetRuns = vi.fn();
const mockSubscribeToRuns = vi.fn(() => vi.fn());
const mockComputeDiffRows = vi.fn();

vi.mock("@/lib/data", () => ({
  getDataInitState: ((...args: any[]) => (mockGetDataInitState as any)(...args)) as any,
  subscribeToDataInit: ((...args: any[]) => (mockSubscribeToDataInit as any)(...args)) as any,
  getRuns: ((...args: any[]) => (mockGetRuns as any)(...args)) as any,
  subscribeToRuns: ((...args: any[]) => (mockSubscribeToRuns as any)(...args)) as any,
  computeDiffRows: ((...args: any[]) => (mockComputeDiffRows as any)(...args)) as any,
}));

const mockLoadResultsForRun = vi.fn();
vi.mock("@/lib/runsLoader", () => ({
  loadResultsForRun: mockLoadResultsForRun,
}));

vi.mock("@/components/aware/CompareSummary", () => ({
  CompareRunsHeader: vi.fn(() => <div data-testid="compare-header">CompareRunsHeader</div>),
  CompareSummary: vi.fn(() => <div>CompareSummary</div>),
}));

vi.mock("@/components/aware/CompareRunSelector", () => ({
  CompareRunSelector: vi.fn(({ label, onChange }: any) => (
    <div data-testid="run-selector">
      <span>{label}</span>
      <button onClick={() => onChange("run_other-003")}>Select Run</button>
    </div>
  )),
}));

const mockRuns = [
  { id: "run_base-001", label: "Baseline Run", suiteId: "suite_1", envId: "qa_prod", env: "QA", network: "production", status: "PASS", passPct: 100, failures: 0, duration: "45s", durationMs: 45000, started: "2025-01-10T10:00:00Z", build: "b1", rev: "abc" },
  { id: "run_cand-002", label: "Candidate Run", suiteId: "suite_1", envId: "qa_prod", env: "QA", network: "production", status: "FAIL", passPct: 80, failures: 2, duration: "52s", durationMs: 52000, started: "2025-01-15T10:00:00Z", build: "b2", rev: "def" },
  { id: "run_other-003", label: "Other Run", suiteId: "suite_1", envId: "qa_staging", env: "QA", network: "staging", status: "PASS", passPct: 100, failures: 0, duration: "48s", durationMs: 48000, started: "2025-01-12T10:00:00Z", build: "b3", rev: "ghi" },
];

const mockDiffRows = [
  { name: "test-login", baseStatus: "PASS", candStatus: "FAIL", durBase: 100, durCand: 200, state: "regression" as const },
  { name: "test-logout", baseStatus: "PASS", candStatus: "PASS", durBase: 150, durCand: 145, state: "unchanged" as const },
  { name: "test-signup", baseStatus: "FAIL", candStatus: "PASS", durBase: 300, durCand: 280, state: "fixed" as const },
];

const initStateLoaded = {
  loaded: true, loading: false, runsReady: true, suitesReady: true,
  promotionsReady: true, schedulerReady: true, discoveryReady: true, resultsReady: true, error: null,
};

describe("Compare page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDataInitState.mockReturnValue(initStateLoaded);
    mockGetRuns.mockReturnValue(mockRuns);
    mockLoadResultsForRun.mockResolvedValue([]);
    mockComputeDiffRows.mockReturnValue(mockDiffRows);
    mockUseSyncedUrlState.mockImplementation((key: string, def: string) => {
      if (key === "baseline") return ["run_base-001", mockSetBaseline];
      if (key === "candidate") return ["run_cand-002", mockSetCandidate];
      if (key === "q") return ["", mockSetSearchText];
      if (key === "filter") return [null, mockSetActiveFilter];
      return [def, vi.fn()];
    });
  });

  it("renders with runs loaded and diff rows displayed", async () => {
    const Compare = (await import("../Compare")).default;
    render(React.createElement(Compare));

    await waitFor(() => {
      expect(screen.getByText("test-login")).toBeDefined();
    });
    expect(screen.getByText("test-logout")).toBeDefined();
    expect(screen.getByText("test-signup")).toBeDefined();
    expect(screen.getAllByTestId("run-selector").length).toBe(2);
  });

  it("filter buttons call setActiveFilter with correct values", async () => {
    const Compare = (await import("../Compare")).default;
    render(React.createElement(Compare));

    await waitFor(() => {
      expect(screen.getByText("test-login")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Regression"));
    expect(mockSetActiveFilter).toHaveBeenCalledWith("regression");

    fireEvent.click(screen.getByText("Fixed"));
    expect(mockSetActiveFilter).toHaveBeenCalledWith("fixed");
  });

  it("swap button calls setBaseline and setCandidate", async () => {
    const Compare = (await import("../Compare")).default;
    render(React.createElement(Compare));

    await waitFor(() => {
      expect(screen.getByText("test-login")).toBeDefined();
    });

    const swapButton = screen.getByRole("button", { name: "" });
    fireEvent.click(swapButton);
    expect(mockSetBaseline).toHaveBeenCalledWith("run_cand-002");
    expect(mockSetCandidate).toHaveBeenCalledWith("run_base-001");
  });

  it("renders empty state when no diff rows", async () => {
    mockComputeDiffRows.mockReturnValue([]);

    const Compare = (await import("../Compare")).default;
    render(React.createElement(Compare));

    await waitFor(() => {
      expect(screen.getByText("FORENSIC COMPARE")).toBeDefined();
    });
    expect(screen.queryByText("test-login")).toBeNull();
    expect(screen.getAllByTestId("run-selector").length).toBe(2);
  });

  it("filters rows by search text", async () => {
    const Compare = (await import("../Compare")).default;
    render(React.createElement(Compare));

    await waitFor(() => {
      expect(screen.getByText("test-login")).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText("SEARCH DIFFS...");
    fireEvent.change(searchInput, { target: { value: "login" } });
    expect(mockSetSearchText).toHaveBeenCalledWith("login");
  });

  it("renders error state", async () => {
    mockGetDataInitState.mockReturnValue({ ...initStateLoaded, loaded: false, error: "Failed to load" });

    const Compare = (await import("../Compare")).default;
    render(React.createElement(Compare));

    expect(screen.getByText("ERROR LOADING")).toBeDefined();
  });
});
