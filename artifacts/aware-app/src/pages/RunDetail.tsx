import React, { useSyncExternalStore } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import {
  getRunById,
  getTestResultsForRun,
  getImageSource,
  preloadImage,
  getDataInitState,
  subscribeToDataInit,
} from "@/lib/data";
import type { TestResult, TestAssertionResult, FilmstripFrame } from "@/lib/types";
import {
  XCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  BarChart3,
  FileText,
  Maximize2,
  X,
  ChevronDown,
} from "lucide-react";
import { useSyncedUrlState } from "@/lib/urlState";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { PanelErrorBoundary } from "@/components/aware/PanelErrorBoundary";
import {
  TimeWindowProvider,
  TimeWindowControls,
  TestHistoryStrip,
} from "@/components/aware/HistoryTimeline";
import { Dialog, DialogContent } from "@/components/ui/dialog";

function AssertionRow({ a }: { a: TestAssertionResult }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 8px",
        borderRadius: 4,
        background: a.passed ? "var(--proof-green-bg)" : "var(--proof-red-bg)",
        border: `1px solid ${a.passed ? "var(--proof-green)" : "var(--proof-red)"}`,
        fontSize: 12,
      }}
    >
      {a.passed ? (
        <Check size={13} style={{ color: "var(--proof-green)", flexShrink: 0 }} />
      ) : (
        <XCircle size={13} style={{ color: "var(--proof-red)", flexShrink: 0 }} />
      )}
      <span style={{ flex: 1, fontWeight: 500 }}>{a.assertion}</span>
      <span style={{ color: "var(--proof-text-secondary)", fontSize: 11 }}>
        Expected:{" "}
        <span
          style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--proof-text)" }}
        >
          {a.expected}
        </span>
      </span>
      {!a.passed && (
        <span style={{ color: "var(--proof-text-secondary)", fontSize: 11 }}>
          Actual:{" "}
          <span
            style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--proof-red)" }}
          >
            {a.actual}
          </span>
        </span>
      )}
    </div>
  );
}

function FilmstripViewer({ frames, onClose }: { frames: FilmstripFrame[]; onClose: () => void }) {
  const [activeIdx, setActiveIdx] = React.useState<number | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStart = React.useRef({ x: 0, scrollLeft: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, scrollLeft: scrollRef.current.scrollLeft };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const dx = e.clientX - dragStart.current.x;
    scrollRef.current.scrollLeft = dragStart.current.scrollLeft - dx;
  };

  const handleMouseUp = () => setIsDragging(false);

  const scrollTo = (dir: -1 | 1) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 160, behavior: "smooth" });
  };

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        el.scrollBy({ left: -160, behavior: "smooth" });
        e.preventDefault();
      }
      if (e.key === "ArrowRight") {
        el.scrollBy({ left: 160, behavior: "smooth" });
        e.preventDefault();
      }
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, []);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "var(--proof-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            flex: 1,
          }}
        >
          Filmstrip ({frames.length})
        </span>
        <button
          onClick={() => scrollTo(-1)}
          style={{
            border: "none",
            background: "var(--proof-surface-hover)",
            cursor: "pointer",
            padding: "2px 6px",
            borderRadius: 3,
            color: "var(--proof-text-secondary)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ChevronLeft size={11} />
        </button>
        <button
          onClick={() => scrollTo(1)}
          style={{
            border: "none",
            background: "var(--proof-surface-hover)",
            cursor: "pointer",
            padding: "2px 6px",
            borderRadius: 3,
            color: "var(--proof-text-secondary)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ChevronRight size={11} />
        </button>
      </div>
      <div
        ref={scrollRef}
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 4,
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
          scrollBehavior: "smooth",
          outline: "none",
        }}
      >
        {frames.map((f, i) => (
          <FilmstripThumbnail
            key={f.id}
            frame={f}
            isActive={activeIdx === i}
            onExpand={() => setActiveIdx(i)}
          />
        ))}
      </div>

      {/* Lightbox gallery */}
      <Dialog
        open={activeIdx !== null}
        onOpenChange={(open) => {
          if (!open) setActiveIdx(null);
        }}
      >
        <DialogContent
          style={{
            maxWidth: "95vw",
            width: "auto",
            background: "var(--proof-surface)",
            border: "1px solid var(--proof-grey)",
            padding: 0,
            overflow: "hidden",
          }}
        >
          {activeIdx !== null && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderBottom: "1px solid var(--proof-grey)",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--proof-text-secondary)",
                    fontFamily: "var(--font-mono)",
                    flex: 1,
                  }}
                >
                  {frames[activeIdx].label}
                </span>
                <span style={{ fontSize: 10, color: "var(--proof-text-muted)" }}>
                  {activeIdx + 1} / {frames.length}
                </span>
                <button
                  onClick={onClose}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "var(--proof-text-secondary)",
                    display: "flex",
                  }}
                >
                  <X size={14} />
                </button>
              </div>
              <GalleryImage
                frame={frames[activeIdx]}
                onPrev={activeIdx > 0 ? () => setActiveIdx(activeIdx - 1) : null}
                onNext={activeIdx < frames.length - 1 ? () => setActiveIdx(activeIdx + 1) : null}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LazyGalleryImage({ source }: { source: string }) {
  const [url, setUrl] = React.useState("");
  React.useEffect(() => {
    preloadImage(source).then(setUrl);
  }, [source]);
  if (!url) {
    return (
      <div
        style={{
          width: 400,
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          color: "var(--proof-text-secondary)",
        }}
      >
        Loading…
      </div>
    );
  }
  return (
    <img
      src={url}
      alt=""
      style={{ maxWidth: "100%", maxHeight: "70vh", borderRadius: 4, display: "block" }}
    />
  );
}

function GalleryImage({
  frame,
  onPrev,
  onNext,
}: {
  frame: FilmstripFrame;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
}) {
  const source = getImageSource(frame);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && onPrev) {
        onPrev();
        e.preventDefault();
      }
      if (e.key === "ArrowRight" && onNext) {
        onNext();
        e.preventDefault();
      }
      if (e.key === "Escape") {
        /* handled by Dialog */
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onPrev, onNext]);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        maxHeight: "80vh",
      }}
    >
      {onPrev && (
        <button
          onClick={onPrev}
          style={{
            position: "absolute",
            left: 8,
            top: "50%",
            transform: "translateY(-50%)",
            border: "none",
            background: "rgba(0,0,0,0.5)",
            color: "#fff",
            cursor: "pointer",
            borderRadius: "50%",
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            backdropFilter: "blur(4px)",
          }}
        >
          <ChevronLeft size={18} />
        </button>
      )}
      {source.startsWith("data:") ? (
        <img
          src={source}
          alt={frame.label}
          style={{ maxWidth: "100%", maxHeight: "70vh", borderRadius: 4, display: "block" }}
        />
      ) : (
        <LazyGalleryImage source={source} />
      )}
      {onNext && (
        <button
          onClick={onNext}
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            border: "none",
            background: "rgba(0,0,0,0.5)",
            color: "#fff",
            cursor: "pointer",
            borderRadius: "50%",
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            backdropFilter: "blur(4px)",
          }}
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}

function FilmstripThumbnail({
  frame,
  isActive,
  onExpand,
}: {
  frame: FilmstripFrame;
  isActive: boolean;
  onExpand: () => void;
}) {
  const isDataUri = React.useMemo(() => getImageSource(frame).startsWith("data:"), [frame]);
  const [src, setSrc] = React.useState<string>(() => getImageSource(frame));
  const [loaded, setLoaded] = React.useState(isDataUri);

  React.useEffect(() => {
    const source = getImageSource(frame);
    if (!source.startsWith("data:")) {
      preloadImage(source).then((url) => {
        setSrc(url);
        setLoaded(true);
      });
    }
  }, [frame, frame.dataUri, frame.imageUrl]);

  return (
    <div style={{ flexShrink: 0, width: 140 }}>
      <button
        onClick={onExpand}
        style={{
          padding: 0,
          border: "none",
          background: "none",
          cursor: "pointer",
          display: "block",
          width: "100%",
        }}
      >
        {loaded ? (
          <img
            src={src}
            alt={frame.label}
            loading="lazy"
            style={{
              width: "100%",
              borderRadius: 4,
              border: isActive ? "2px solid var(--proof-blue)" : "1px solid var(--proof-grey)",
              display: "block",
              boxShadow: isActive ? "0 0 0 2px var(--proof-blue-bg)" : undefined,
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: 80,
              borderRadius: 4,
              border: "1px solid var(--proof-grey)",
              background: "var(--proof-grey-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              color: "var(--proof-text-secondary)",
            }}
          >
            Loading…
          </div>
        )}
      </button>
      <div
        style={{
          fontSize: 9,
          color: isActive ? "var(--proof-blue)" : "var(--proof-text-secondary)",
          marginTop: 2,
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          fontWeight: isActive ? 600 : 400,
        }}
      >
        {frame.label}
        <Maximize2 size={9} />
      </div>
    </div>
  );
}

export default function RunDetail() {
  const params = useParams<{ runId: string }>();
  const [, navigate] = useLocation();
  const urlSearch = useSearch();
  const runId = params.runId ?? "";
  const { Toast } = useSimpleToast();

  const initState = useSyncExternalStore(subscribeToDataInit, getDataInitState);
  const run = getRunById(runId) ?? null;
  const results = run ? getTestResultsForRun(run.id) : [];
  const [search, setSearch] = useSyncedUrlState("q", "");
  const [statusFilter, setStatusFilter] = useSyncedUrlState("status", "all");
  const [catFilter, setCatFilter] = useSyncedUrlState("cat", "all");
  const [page, setPage] = React.useState(0);
  const [detailPanelCollapsed, setDetailPanelCollapsed] = React.useState(false);
  const PAGE_SIZE = 20;

  const [prevFilterKey, setPrevFilterKey] = React.useState("");
  const filterKey = `${search}|${statusFilter}|${catFilter}`;
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setPage(0);
  }
  const urlTestId = React.useMemo(() => new URLSearchParams(urlSearch).get("testId"), [urlSearch]);
  const [selectedResult, setSelectedResult] = React.useState<TestResult | null>(() => {
    if (urlTestId && run) return null;
    return null;
  });

  if (!run) {
    if (initState.loading) {
      return (
        <div style={{ textAlign: "center", padding: 64 }}>
          <div
            className="proof-skeleton"
            style={{ width: 48, height: 48, borderRadius: "50%", margin: "0 auto 16px" }}
          />
          <div
            className="proof-skeleton"
            style={{ width: 200, height: 16, borderRadius: 4, margin: "0 auto 8px" }}
          />
          <div style={{ fontSize: 13, color: "var(--proof-text-secondary)", marginTop: 12 }}>
            Loading run data...
          </div>
        </div>
      );
    }
    return (
      <div style={{ textAlign: "center", padding: 64 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--proof-text-primary)" }}>
          Run not found
        </h2>
        <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", marginTop: 8 }}>
          The requested run does not exist.
        </p>
        <button
          onClick={() => navigate("/runs")}
          className="proof-button"
          style={{ fontSize: 13, marginTop: 16 }}
        >
          Back to Runs
        </button>
      </div>
    );
  }

  const filtered = results.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (catFilter !== "all" && r.category !== catFilter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pagedResults = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const selIdx = selectedResult ? filtered.findIndex((r) => r.id === selectedResult.id) : -1;

  const setSelectedResultSyncUrl = (r: TestResult | null) => {
    setSelectedResult(r);
    const base = `/runs/${run.id}`;
    if (r) navigate(`${base}?testId=${r.id}`, { replace: true });
    else navigate(base, { replace: true });
  };

  const navigateDetail = (dir: -1 | 1) => {
    const next = selIdx + dir;
    if (next >= 0 && next < filtered.length) setSelectedResultSyncUrl(filtered[next]);
  };

  return (
    <div
      className="proof-page"
      style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, minHeight: 0 }}
    >
      {/* Chart + results table */}
      <div style={{ display: "flex", gap: 14, flex: 1, minHeight: 0 }}>
        <PanelErrorBoundary label="Test results">
          <div
            className="proof-card"
            style={{
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minWidth: 0,
            }}
          >
            <TimeWindowProvider>
              <div style={{ padding: "6px 14px", borderBottom: "1px solid var(--proof-grey)" }}>
                <TimeWindowControls />
              </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <table className="proof-table">
                <thead>
                  <tr>
                    <th>Test Name</th>
                    <th>Status</th>
                    <th>Category</th>
                    <th style={{ width: 200, whiteSpace: "nowrap" }}>History</th>
                    <th style={{ textAlign: "right" }}>Duration</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedResults.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() =>
                        setSelectedResultSyncUrl(selectedResult?.id === r.id ? null : r)
                      }
                      style={{
                        cursor: "pointer",
                        background:
                          selectedResult?.id === r.id
                            ? "var(--proof-blue-bg)"
                            : r.status === "FAIL"
                              ? "rgba(217,48,37,0.03)"
                              : undefined,
                        outline:
                          selectedResult?.id === r.id
                            ? "2px solid var(--proof-blue) inset"
                            : undefined,
                      }}
                    >
                      <td
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                        }}
                      >
                        {r.name}
                      </td>
                      <td>
                        <span
                          className={`proof-badge ${r.status === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: 11,
                            background: "var(--proof-grey-bg)",
                            padding: "2px 7px",
                            borderRadius: 4,
                            border: "1px solid var(--proof-grey)",
                          }}
                        >
                          {r.category}
                        </span>
                      </td>
                      <td style={{ width: 200, whiteSpace: "nowrap" }}>
                        <TestHistoryStrip testName={r.name} />
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          color: "var(--proof-text-secondary)",
                        }}
                      >
                        {r.duration}ms
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/trends?testId=${r.id}`)}
                          className="proof-button proof-button-xs"
                          style={{ padding: "2px 7px" }}
                        >
                          Analytics
                        </button>
                        <button
                          onClick={() => navigate(`/tests?q=${r.id}`)}
                          className="proof-button proof-button-xs"
                          style={{ padding: "2px 7px", marginLeft: 4 }}
                        >
                          <FileText size={10} /> Def
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    padding: "8px 14px",
                    borderTop: "1px solid var(--proof-border)",
                    fontSize: 12,
                  }}
                >
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className="proof-button proof-button-xs"
                  >
                    Prev
                  </button>
                  <span style={{ color: "var(--proof-text-secondary)" }}>
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    className="proof-button proof-button-xs"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
            </TimeWindowProvider>
          </div>
        </PanelErrorBoundary>

        {/* Test Detail Panel */}
        {selectedResult && (
          <PanelErrorBoundary label="Evidence panel">
            <div
              className="proof-card"
              style={{
                width: 380,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                borderLeft: `3px solid ${selectedResult.status === "PASS" ? "var(--proof-green)" : "var(--proof-red)"}`,
              }}
            >
              {/* Panel header */}
              <div
                style={{
                  padding: "10px 14px",
                  borderBottom: "1px solid var(--proof-grey)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "var(--proof-blue-bg)",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    border: "1px solid var(--proof-grey)",
                    borderRadius: 4,
                    background: "var(--proof-surface)",
                  }}
                >
                  <button
                    disabled={selIdx <= 0}
                    onClick={() => navigateDetail(-1)}
                    style={{
                      padding: "4px 7px",
                      border: "none",
                      background: "transparent",
                      cursor: selIdx > 0 ? "pointer" : "not-allowed",
                      color: selIdx > 0 ? "var(--proof-blue)" : "var(--proof-grey)",
                    }}
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--proof-text-secondary)",
                      padding: "0 4px",
                    }}
                  >
                    {selIdx + 1}/{filtered.length}
                  </span>
                  <button
                    disabled={selIdx >= filtered.length - 1}
                    onClick={() => navigateDetail(1)}
                    style={{
                      padding: "4px 7px",
                      border: "none",
                      background: "transparent",
                      cursor: selIdx < filtered.length - 1 ? "pointer" : "not-allowed",
                      color:
                        selIdx < filtered.length - 1 ? "var(--proof-blue)" : "var(--proof-grey)",
                    }}
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color:
                      selectedResult.status === "PASS" ? "var(--proof-green)" : "var(--proof-red)",
                    flex: 1,
                  }}
                >
                  {selectedResult.status}
                </span>
                <button
                  onClick={() => setDetailPanelCollapsed((c) => !c)}
                  aria-label={detailPanelCollapsed ? "Expand" : "Collapse"}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "var(--proof-text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    padding: 4,
                    transform: detailPanelCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                    transition: "transform 0.15s",
                  }}
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  onClick={() => setSelectedResultSyncUrl(null)}
                  aria-label="Close"
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "var(--proof-text-secondary)",
                    fontSize: 18,
                    lineHeight: 1,
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {!detailPanelCollapsed && (
                <>
                  <div
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      padding: 14,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {/* Test name */}
                    <div>
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          fontWeight: 600,
                          lineHeight: 1.5,
                          wordBreak: "break-all",
                        }}
                      >
                        {selectedResult.name}
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <span
                          style={{
                            fontSize: 11,
                            background: "var(--proof-grey-bg)",
                            padding: "2px 8px",
                            borderRadius: 4,
                            border: "1px solid var(--proof-grey)",
                          }}
                        >
                          {selectedResult.category}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--proof-text-secondary)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {selectedResult.duration}ms
                        </span>
                      </div>
                    </div>

                    {/* Filmstrip */}
                    {selectedResult.filmstrip && selectedResult.filmstrip.length > 0 && (
                      <FilmstripViewer frames={selectedResult.filmstrip} onClose={() => {}} />
                    )}

                    {/* HTTP Exchange — always visible */}
                    {(() => {
                      const e = selectedResult.evidence;
                      if (!e)
                        return (
                          <div>
                            <div
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: "var(--proof-text-secondary)",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                marginBottom: 6,
                              }}
                            >
                              HTTP Exchange
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--proof-text-secondary)",
                                fontStyle: "italic",
                              }}
                            >
                              No HTTP data captured
                            </div>
                          </div>
                        );
                      const rows: { label: string; val: string }[] = [];
                      rows.push({ label: "Method", val: e.request.method });
                      rows.push({ label: "URL", val: e.request.url });
                      rows.push({ label: "Status", val: String(e.response.status) });
                      const ct = e.response.headers?.["Content-Type"] ?? "";
                      if (ct) rows.push({ label: "Content-Type", val: ct });
                      const cl = e.response.headers?.["Content-Length"] ?? "";
                      if (cl) rows.push({ label: "Size", val: cl + " bytes" });
                      const cache = e.response.headers?.["Cache-Control"] ?? "";
                      if (cache) rows.push({ label: "Cache", val: cache });
                      return (
                        <div>
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: "var(--proof-text-secondary)",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              marginBottom: 6,
                            }}
                          >
                            HTTP Exchange
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 3,
                              fontSize: 11,
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {rows.map((r) => (
                              <div key={r.label} style={{ display: "flex", gap: 6 }}>
                                <span
                                  style={{
                                    color: "var(--proof-text-secondary)",
                                    width: 80,
                                    flexShrink: 0,
                                  }}
                                >
                                  {r.label}
                                </span>
                                <span
                                  style={{ color: "var(--proof-text)", wordBreak: "break-all" }}
                                >
                                  {r.val}
                                </span>
                              </div>
                            ))}
                          </div>
                          {/* Response headers */}
                          {e.response.headers && Object.keys(e.response.headers).length > 0 && (
                            <details open style={{ marginTop: 8, fontSize: 11 }}>
                              <summary
                                style={{
                                  cursor: "pointer",
                                  color: "var(--proof-text-secondary)",
                                  fontWeight: 600,
                                  fontSize: 10,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                Response Headers ({Object.keys(e.response.headers).length})
                              </summary>
                              <div
                                style={{
                                  marginTop: 4,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 2,
                                }}
                              >
                                {Object.entries(e.response.headers).map(([k, v]) => (
                                  <div
                                    key={k}
                                    style={{
                                      display: "flex",
                                      gap: 6,
                                      fontFamily: "var(--font-mono)",
                                      fontSize: 10,
                                    }}
                                  >
                                    <span style={{ color: "var(--proof-blue)", minWidth: 140 }}>
                                      {k}
                                    </span>
                                    <span
                                      style={{ color: "var(--proof-text)", wordBreak: "break-all" }}
                                    >
                                      {v}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                          {/* Request headers */}
                          {e.request.headers && Object.keys(e.request.headers).length > 0 && (
                            <details open style={{ marginTop: 6, fontSize: 11 }}>
                              <summary
                                style={{
                                  cursor: "pointer",
                                  color: "var(--proof-text-secondary)",
                                  fontWeight: 600,
                                  fontSize: 10,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                Request Headers ({Object.keys(e.request.headers).length})
                              </summary>
                              <div
                                style={{
                                  marginTop: 4,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 2,
                                }}
                              >
                                {Object.entries(e.request.headers).map(([k, v]) => (
                                  <div
                                    key={k}
                                    style={{
                                      display: "flex",
                                      gap: 6,
                                      fontFamily: "var(--font-mono)",
                                      fontSize: 10,
                                    }}
                                  >
                                    <span style={{ color: "var(--proof-purple)", minWidth: 140 }}>
                                      {k}
                                    </span>
                                    <span
                                      style={{ color: "var(--proof-text)", wordBreak: "break-all" }}
                                    >
                                      {v}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                          {/* Cookies */}
                          {e.response.cookies && e.response.cookies.length > 0 && (
                            <details open style={{ marginTop: 6, fontSize: 11 }}>
                              <summary
                                style={{
                                  cursor: "pointer",
                                  color: "var(--proof-text-secondary)",
                                  fontWeight: 600,
                                  fontSize: 10,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                Cookies ({e.response.cookies.length})
                              </summary>
                              <div
                                style={{
                                  marginTop: 4,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 2,
                                }}
                              >
                                {e.response.cookies.map((c, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      display: "flex",
                                      gap: 6,
                                      fontFamily: "var(--font-mono)",
                                      fontSize: 10,
                                      padding: "4px 6px",
                                      background: "var(--proof-grey-bg)",
                                      borderRadius: 4,
                                    }}
                                  >
                                    <span style={{ color: "var(--proof-orange)", fontWeight: 600 }}>
                                      {c.name}
                                    </span>
                                    <span
                                      style={{ color: "var(--proof-text)", wordBreak: "break-all" }}
                                    >
                                      = {c.value}
                                    </span>
                                    {c.domain && (
                                      <span style={{ color: "var(--proof-text-secondary)" }}>
                                        domain={c.domain}
                                      </span>
                                    )}
                                    {c.path && (
                                      <span style={{ color: "var(--proof-text-secondary)" }}>
                                        path={c.path}
                                      </span>
                                    )}
                                    {c.httpOnly && (
                                      <span style={{ color: "var(--proof-green)" }}>HttpOnly</span>
                                    )}
                                    {c.secure && (
                                      <span style={{ color: "var(--proof-green)" }}>Secure</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      );
                    })()}

                    {/* Assertions */}
                    {selectedResult.assertions && selectedResult.assertions.length > 0 && (
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--proof-text-secondary)",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            marginBottom: 6,
                          }}
                        >
                          Assertions
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {selectedResult.assertions.map((a, i) => (
                            <AssertionRow key={i} a={a} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error message */}
                    {selectedResult.error && (
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--proof-text-secondary)",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            marginBottom: 6,
                          }}
                        >
                          Error
                        </div>
                        <pre
                          style={{
                            fontSize: 10,
                            lineHeight: 1.5,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-all",
                            background: "var(--proof-red-bg)",
                            border: "1px solid var(--proof-red)",
                            borderRadius: 4,
                            padding: 10,
                            margin: 0,
                            color: "var(--proof-red)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {selectedResult.error}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Footer actions */}
                  <div
                    style={{
                      padding: "8px 14px",
                      borderTop: "1px solid var(--proof-grey)",
                      display: "flex",
                      gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    <button
                      onClick={() => navigate(`/analytics?testId=${selectedResult.id}`)}
                      className="proof-button proof-button-xs"
                      style={{ flex: 1 }}
                    >
                      <BarChart3 size={11} /> Analytics
                    </button>
                    <button
                      onClick={() => navigate(`/tests?q=${selectedResult.id}`)}
                      className="proof-button proof-button-xs"
                      style={{ flex: 1 }}
                    >
                      <FileText size={11} /> Definition
                    </button>
                  </div>
                </>
              )}
            </div>
          </PanelErrorBoundary>
        )}
      </div>
      {Toast}
    </div>
  );
}
