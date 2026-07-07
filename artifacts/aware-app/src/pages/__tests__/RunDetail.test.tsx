import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const mockNavigate = vi.fn();
vi.mock("wouter", () => ({
  useParams: vi.fn(() => ({ runId: "run_test-001" })),
  useLocation: vi.fn(() => ["/", mockNavigate]),
  Link: vi.fn(({ children, ...props }: any) => <a {...props}>{children}</a>),
}));

const mockSetSearch = vi.fn();
const mockSetStatusFilter = vi.fn();
const mockSetCatFilter = vi.fn();

vi.mock("@/lib/urlState", () => ({
  useSyncedUrlState: vi.fn((key: string, def: string) => {
    if (key === "q") return ["", mockSetSearch];
    if (key === "status") return ["all", mockSetStatusFilter];
    if (key === "cat") return ["all", mockSetCatFilter];
    return [def, vi.fn()];
  }),
}));

const mockGetDataInitState = vi.fn();
const mockSubscribeToDataInit = vi.fn(() => vi.fn());
const mockGetRunById = vi.fn();
const mockGetTestResultsForRun = vi.fn();

vi.mock("@/lib/data", () => ({
  getRunById: ((...args: any[]) => (mockGetRunById as any)(...args)) as any,
  getTestResultsForRun: ((...args: any[]) => (mockGetTestResultsForRun as any)(...args)) as any,
  getDataInitState: ((...args: any[]) => (mockGetDataInitState as any)(...args)) as any,
  subscribeToDataInit: ((...args: any[]) => (mockSubscribeToDataInit as any)(...args)) as any,
}));

const mockGetVirtualItems = vi.fn();
const mockGetTotalSize = vi.fn();

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: vi.fn(() => ({
    getVirtualItems: mockGetVirtualItems,
    getTotalSize: mockGetTotalSize,
  })),
}));

vi.mock("@/components/aware/Skeleton", () => ({
  SkeletonTable: vi.fn(() => <div data-testid="skeleton-table">SkeletonTable</div>),
  SkeletonText: vi.fn(({ lines }: { lines: number }) => (
    <div data-testid="skeleton-text">SkeletonText ({lines} lines)</div>
  )),
}));

vi.mock("@/components/aware/AssertionRow", () => ({
  AssertionRow: vi.fn(({ a }: any) => <div data-testid="assertion-row">{a.assertion}</div>),
}));

vi.mock("@/components/aware/HistoryTimeline", () => ({
  TestHistoryStrip: vi.fn(() => <div data-testid="history-strip" />),
}));

const mockRun = {
  id: "run_test-001", label: "Test Run", suiteId: "suite_1", envId: "qa_prod",
  env: "QA", network: "production", status: "PASS", passPct: 100, failures: 0,
  duration: "45s", durationMs: 45000, started: "2025-01-15T10:00:00Z", build: "b1", rev: "abc123",
};

const mockTestResults = [
  {
    id: "result_1", testCaseId: "tc_001", runId: "run_test-001", name: "test-security-login",
    status: "PASS" as const, duration: 1200, category: "Security", suite: "test_security.py",
    assertions: [{ assertion: "Status is 200", expected: "200", actual: "200", passed: true }],
    evidence: { request: { method: "GET", url: "https://example.com", headers: {} }, response: { status: 200, headers: {}, timings: { dnsLookup: 1, tcpConnect: 2, tlsHandshake: 3, ttfb: 10, download: 5, total: 21 } } },
    filmstrip: [],
  },
  {
    id: "result_2", testCaseId: "tc_002", runId: "run_test-001", name: "test-performance-latency",
    status: "FAIL" as const, duration: 3400, category: "Performance", suite: "test_perf.py",
    error: "Response time exceeded threshold", assertions: [],
    evidence: { request: { method: "GET", url: "https://example.com/api", headers: {} }, response: { status: 503, headers: {}, timings: { dnsLookup: 1, tcpConnect: 5, tlsHandshake: 8, ttfb: 2000, download: 1200, total: 3214 } } },
    filmstrip: [],
  },
];

const initStateNotLoaded = {
  loaded: false, loading: true, runsReady: false, suitesReady: false,
  promotionsReady: false, schedulerReady: false, discoveryReady: false, resultsReady: false, error: null,
};

const initStateLoaded = {
  loaded: true, loading: false, runsReady: true, suitesReady: true,
  promotionsReady: true, schedulerReady: true, discoveryReady: true, resultsReady: true, error: null,
};

describe("RunDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetVirtualItems.mockReturnValue([]);
    mockGetTotalSize.mockReturnValue(0);
  });

  it("renders loading state while data is initializing", async () => {
    mockGetDataInitState.mockReturnValue(initStateNotLoaded);
    mockGetRunById.mockReturnValue(undefined);

    const RunDetail = (await import("../RunDetail")).default;
    render(React.createElement(RunDetail));

    expect(screen.getByTestId("skeleton-text")).toBeDefined();
    expect(screen.getByTestId("skeleton-table")).toBeDefined();
  });

  it("renders not found state when run does not exist", async () => {
    mockGetDataInitState.mockReturnValue(initStateLoaded);
    mockGetRunById.mockReturnValue(undefined);

    const RunDetail = (await import("../RunDetail")).default;
    render(React.createElement(RunDetail));

    expect(screen.getByText("Run not found")).toBeDefined();
    expect(screen.getByText("Back to Runs")).toBeDefined();
  });

  it("renders test results table when data is ready", async () => {
    mockGetDataInitState.mockReturnValue(initStateLoaded);
    mockGetRunById.mockReturnValue(mockRun);
    mockGetTestResultsForRun.mockReturnValue(mockTestResults);
    mockGetVirtualItems.mockReturnValue(
      mockTestResults.map((_, i) => ({ key: `item-${i}`, index: i, start: i * 52, size: 52, lane: 0 })),
    );
    mockGetTotalSize.mockReturnValue(mockTestResults.length * 52);

    const RunDetail = (await import("../RunDetail")).default;
    render(React.createElement(RunDetail));

    await waitFor(() => {
      expect(screen.getByText("test-security-login")).toBeDefined();
    });
    expect(screen.getByText("test-performance-latency")).toBeDefined();
  });

  it("filters results by status and search", async () => {
    mockGetDataInitState.mockReturnValue(initStateLoaded);
    mockGetRunById.mockReturnValue(mockRun);
    mockGetTestResultsForRun.mockReturnValue(mockTestResults);
    mockGetVirtualItems.mockReturnValue(
      mockTestResults.map((_, i) => ({ key: `item-${i}`, index: i, start: i * 52, size: 52, lane: 0 })),
    );
    mockGetTotalSize.mockReturnValue(mockTestResults.length * 52);

    const RunDetail = (await import("../RunDetail")).default;
    render(React.createElement(RunDetail));

    await waitFor(() => {
      expect(screen.getByText("test-performance-latency")).toBeDefined();
    });

    const statusSelect = screen.getByDisplayValue("All Status");
    fireEvent.change(statusSelect, { target: { value: "PASS" } });
    expect(mockSetStatusFilter).toHaveBeenCalledWith("PASS");

    const searchInput = screen.getByPlaceholderText("Search tests...");
    fireEvent.change(searchInput, { target: { value: "security" } });
    expect(mockSetSearch).toHaveBeenCalledWith("security");
  });

  it("renders error state with retry button", async () => {
    const reloadSpy = vi.spyOn(window.location, "reload").mockImplementation(() => {});
    mockGetDataInitState.mockReturnValue({ ...initStateNotLoaded, loading: false, error: "Network error: failed to fetch" });

    const RunDetail = (await import("../RunDetail")).default;
    render(React.createElement(RunDetail));

    expect(screen.getByText("Failed to load data")).toBeDefined();
    const retryButton = screen.getByText("Retry");
    expect(retryButton).toBeDefined();

    fireEvent.click(retryButton);
    expect(reloadSpy).toHaveBeenCalled();

    reloadSpy.mockRestore();
  });
});
