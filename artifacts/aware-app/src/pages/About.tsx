import React from "react";
import { AppLayout } from "@/components/aware/AppLayout";
import { Link } from "wouter";
import {
  Zap,
  BarChart3,
  GitCompare,
  Bug,
  Activity,
  Shield,
  Globe,
  Book,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Maximize2,
  X,
  Search,
} from "lucide-react";
import { RUNS, DIFF_ROWS } from "@/lib/data";

function DocTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table className="proof-table" style={{ margin: "8px 0", fontSize: 11 }}>
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td
                key={j}
                style={{ fontFamily: j === 0 ? "var(--font-mono)" : undefined, fontSize: 11 }}
              >
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface DocEntry {
  id: string;
  icon: string;
  number: string;
  title: string;
  content: () => React.ReactNode;
}

function DocViewer({ sections }: { sections: DocEntry[] }) {
  const [activeId, setActiveId] = React.useState(sections[0]?.id ?? "");
  const [history, setHistory] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState("");
  const [fullscreen, setFullscreen] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const filtered = sections.filter(
    (s) =>
      !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.number.includes(search),
  );

  const activeIdx = sections.findIndex((s) => s.id === activeId);
  const active = sections[activeIdx] ?? sections[0];
  const prev = activeIdx > 0 ? sections[activeIdx - 1] : null;
  const next = activeIdx < sections.length - 1 ? sections[activeIdx + 1] : null;

  const goTo = (id: string) => {
    setHistory((prev) => [activeId, ...prev].slice(0, 20));
    setActiveId(id);
  };

  const goBack = () => {
    if (history.length === 0) return;
    const prevId = history[0];
    setHistory((h) => h.slice(1));
    setActiveId(prevId);
  };

  React.useEffect(() => {
    contentRef.current?.scrollTo(0, 0);
  }, [activeId]);

  const panel = (
    <div
      style={{
        display: "flex",
        gap: 0,
        border: "1px solid var(--proof-grey)",
        borderRadius: 8,
        overflow: "hidden",
        background: "var(--proof-surface)",
        height: "100%",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: 260,
          flexShrink: 0,
          borderRight: "1px solid var(--proof-grey)",
          display: "flex",
          flexDirection: "column",
          background: "var(--proof-grey-bg)",
        }}
      >
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid var(--proof-grey)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Book size={14} style={{ color: "var(--proof-text-secondary)" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text)", flex: 1 }}>
            Documentation
          </span>
          <span
            style={{
              fontSize: 10,
              color: "var(--proof-text-secondary)",
              background: "var(--proof-surface)",
              padding: "1px 6px",
              borderRadius: 4,
            }}
          >
            {sections.length}
          </span>
        </div>
        <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--proof-grey)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              borderRadius: 4,
              border: "1px solid var(--proof-grey)",
              background: "var(--proof-surface)",
            }}
          >
            <Search size={12} style={{ color: "var(--proof-text-secondary)", flexShrink: 0 }} />
            <input
              placeholder="Filter sections..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                fontSize: 11,
                background: "transparent",
                flex: 1,
                minWidth: 0,
                color: "var(--proof-text)",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: "var(--proof-text-secondary)",
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                <X size={10} />
              </button>
            )}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
          {filtered.map((s) => {
            const isActive = s.id === activeId;
            return (
              <button
                key={s.id}
                onClick={() => {
                  goTo(s.id);
                  setSearch("");
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 11,
                  textAlign: "left",
                  background: isActive ? "var(--proof-blue)" : "transparent",
                  color: isActive ? "#fff" : "var(--proof-text)",
                  fontWeight: isActive ? 600 : 400,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "var(--proof-surface)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>{s.icon}</span>
                <span style={{ flex: 1, lineHeight: 1.3 }}>{s.title}</span>
                <span
                  style={{
                    fontSize: 9,
                    opacity: 0.6,
                    fontFamily: "var(--font-mono)",
                    flexShrink: 0,
                  }}
                >
                  {s.number}
                </span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div
              style={{
                padding: "24px 14px",
                textAlign: "center",
                fontSize: 11,
                color: "var(--proof-text-secondary)",
              }}
            >
              No sections match "{search}"
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 28px",
          fontSize: 12,
          lineHeight: 1.7,
          color: "var(--proof-text-secondary)",
        }}
      >
        {active && (
          <div>
            {/* Header bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 20,
                paddingBottom: 12,
                borderBottom: "1px solid var(--proof-grey)",
              }}
            >
              <button
                onClick={goBack}
                disabled={history.length === 0}
                style={{
                  border: "none",
                  background: "none",
                  cursor: history.length > 0 ? "pointer" : "default",
                  color: history.length > 0 ? "var(--proof-text)" : "var(--proof-grey)",
                  padding: "2px 6px",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                }}
                title="Back to previous section"
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: 16 }}>{active.icon}</span>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--proof-text)", margin: 0 }}>
                {active.title}
              </h3>
              <button
                onClick={() => setFullscreen(true)}
                className="proof-button"
                style={{
                  fontSize: 10,
                  padding: "3px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
                title="Open fullscreen documentation viewer"
              >
                <Maximize2 size={11} /> Fullscreen
              </button>
              <span
                style={{
                  fontSize: 10,
                  color: "var(--proof-text-secondary)",
                  fontFamily: "var(--font-mono)",
                  marginLeft: "auto",
                }}
              >
                {activeIdx + 1} / {sections.length}
              </span>
            </div>

            {active.content()}

            {/* Prev / Next footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 28,
                paddingTop: 16,
                borderTop: "1px solid var(--proof-grey)",
              }}
            >
              {prev ? (
                <button
                  onClick={() => goTo(prev.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    border: "1px solid var(--proof-grey)",
                    borderRadius: 4,
                    padding: "6px 12px",
                    background: "transparent",
                    cursor: "pointer",
                    color: "var(--proof-text)",
                  }}
                >
                  <ChevronLeft size={12} /> {prev.icon} {prev.title}
                </button>
              ) : (
                <div />
              )}
              <span style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>
                {active.number} of {sections.length}
              </span>
              {next ? (
                <button
                  onClick={() => goTo(next.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    border: "1px solid var(--proof-grey)",
                    borderRadius: 4,
                    padding: "6px 12px",
                    background: "transparent",
                    cursor: "pointer",
                    color: "var(--proof-text)",
                  }}
                >
                  {next.icon} {next.title} <ChevronRight size={12} />
                </button>
              ) : (
                <div />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          background: "var(--proof-surface)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "8px 16px",
            borderBottom: "1px solid var(--proof-grey)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
            background: "var(--proof-grey-bg)",
          }}
        >
          <button
            onClick={() => setFullscreen(false)}
            className="proof-button"
            style={{
              fontSize: 11,
              padding: "4px 10px",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <X size={14} /> Close
          </button>
          <span style={{ fontSize: 12, color: "var(--proof-text-secondary)" }}>|</span>
          <Book size={14} style={{ color: "var(--proof-text-secondary)" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--proof-text)" }}>
            Documentation
          </span>
          <span
            style={{
              fontSize: 10,
              color: "var(--proof-text-secondary)",
              marginLeft: "auto",
              fontFamily: "var(--font-mono)",
            }}
          >
            {activeIdx + 1} / {sections.length}
          </span>
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>{panel}</div>
      </div>
    );
  }

  return panel;
}

const ICON_MAP = { GitCompare, Shield, Globe, Bug, Activity, Zap, BarChart3 } as const;
type SlideIcon = keyof typeof ICON_MAP;

interface SlideData {
  id: string;
  icon: SlideIcon;
  title: string;
  color: string;
  detail: string;
  points: string[];
}

const DEFAULT_SLIDES: SlideData[] = [
  {
    id: "s1",
    icon: "GitCompare",
    title: "Regression Detection",
    color: "var(--proof-red)",
    detail:
      "Catch regressions before they reach production with baseline-vs-candidate diff analysis.",
    points: [
      "Side-by-side test result comparison",
      "Column filters for status, duration, environment",
      "Permalink sharing for team review",
      "One-click GitHub issue filing",
    ],
  },
  {
    id: "s2",
    icon: "Shield",
    title: "Promotion Gating",
    color: "var(--proof-orange)",
    detail:
      "Block or approve deployments based on per-environment pass-rate thresholds and regression checks.",
    points: [
      "Pass-rate comparison across env tiers",
      "Version drift tracking between builds",
      "Alert triage with run history drill-down",
      "Automated promotion decision support",
    ],
  },
  {
    id: "s3",
    icon: "Globe",
    title: "Cross-Environment Testing",
    color: "var(--proof-blue)",
    detail:
      "Compare test behavior across QA, UAT, and PROD Akamai edge environments with always-visible property status.",
    points: [
      "Per-environment pass-rate charts (QA / UAT / PROD)",
      "Active Akamai property version shown on every page",
      "Playwright + pytest runs with GitHub Actions integration",
      "Promotion gate: UAT → PROD requires ≥ 95% pass rate",
    ],
  },
  {
    id: "s4",
    icon: "Bug",
    title: "Test Case Lifecycle",
    color: "var(--proof-green)",
    detail: "Create, organize, import/export, and AI-generate test cases and suites.",
    points: [
      "Tabbed CRUD form with docs & HTTP config",
      "Multi-format import (JSON, YAML, JUnit XML)",
      "Bulk actions: delete, status change, add to suite",
      "AI-powered test generation from prompts",
    ],
  },
  {
    id: "s5",
    icon: "Activity",
    title: "CI/CD Observability",
    color: "var(--proof-purple)",
    detail: "Monitor GitHub Actions run history, pass rates, failure trends, and run frequency.",
    points: [
      "Filterable run table with detail side panels",
      "Pass-rate charts by day and environment",
      "Run frequency tracking with gap detection",
      "Export and Slack sharing for team communication",
    ],
  },
  {
    id: "s6",
    icon: "Zap",
    title: "AI-Powered Analysis",
    color: "var(--proof-yellow)",
    detail:
      "Use LLM to analyze test failures, explain diffs, generate test scripts, and generate suites.",
    points: [
      "Multi-provider: OpenAI, WebLLM, Chrome Built-in AI",
      "5 built-in skills for code gen & analysis",
      "Rolling chat history with skill context",
      "WebLLM support for fully offline operation",
    ],
  },
];

function CarouselSlides() {
  const [slides] = React.useState<SlideData[]>(DEFAULT_SLIDES);
  const [idx, setIdx] = React.useState(0);
  const [fullscreen, setFullscreen] = React.useState(false);
  const total = slides.length;
  const slide = slides[idx] || slides[0];
  const Icon = slide ? ICON_MAP[slide.icon] : Zap;

  React.useEffect(() => {
    if (total < 2) return;
    const t = setInterval(() => setIdx((prev) => (prev + 1) % total), 5000);
    return () => clearInterval(t);
  }, [total]);

  // ---- Fullscreen ----
  if (fullscreen && slide) {
    const FsIcon = ICON_MAP[slide.icon];
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(0,0,0,0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
        }}
        onClick={() => setFullscreen(false)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#fff",
            borderRadius: 20,
            maxWidth: 700,
            width: "100%",
            padding: "48px 52px",
            position: "relative",
            boxShadow: "0 8px 40px rgba(0,0,0,.3)",
          }}
        >
          <button
            onClick={() => setFullscreen(false)}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              border: "none",
              borderRadius: 8,
              background: "var(--proof-grey-bg)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--proof-text-secondary)",
            }}
          >
            <X size={16} />
          </button>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
            <div
              style={{
                width: 52,
                height: 52,
                background: slide.color,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FsIcon size={26} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "var(--proof-text)",
                  marginBottom: 8,
                }}
              >
                {slide.title}
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--proof-text-secondary)",
                  lineHeight: 1.7,
                  marginBottom: 20,
                }}
              >
                {slide.detail}
              </p>
              <ul
                style={{
                  padding: 0,
                  margin: 0,
                  listStyle: "none",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px 20px",
                }}
              >
                {slide.points.map((p) => (
                  <li
                    key={p}
                    style={{
                      fontSize: 13,
                      color: "var(--proof-text)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <CheckCircle2 size={14} color={slide.color} style={{ flexShrink: 0 }} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div
            style={{
              marginTop: 24,
              paddingTop: 16,
              borderTop: "1px solid var(--proof-grey)",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: "var(--proof-text-secondary)",
            }}
          >
            <span
              style={{
                background: slide.color + "20",
                color: slide.color,
                padding: "3px 10px",
                borderRadius: 12,
                fontWeight: 600,
              }}
            >
              {"16:9"}
            </span>
            <span>A.W.A.R.E. · {slide.title}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!slide) return null;

  return (
    <>
      {/* Main slide + filmstrip layout */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Main preview */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 20,
            minHeight: 130,
            position: "relative",
          }}
        >
          <button
            onClick={() => setFullscreen(true)}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 28,
              height: 28,
              border: "1px solid var(--proof-grey)",
              borderRadius: 6,
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--proof-text-secondary)",
            }}
            title="Fullscreen"
          >
            <Maximize2 size={14} />
          </button>
          <div
            style={{
              width: 44,
              height: 44,
              background: slide.color,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              opacity: 0.9,
            }}
          >
            <Icon size={22} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{ fontSize: 16, fontWeight: 700, color: "var(--proof-text)", marginBottom: 4 }}
            >
              {slide.title}
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "var(--proof-text-secondary)",
                lineHeight: 1.6,
                marginBottom: 12,
              }}
            >
              {slide.detail}
            </p>
            <ul
              style={{
                padding: 0,
                margin: 0,
                listStyle: "none",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "3px 16px",
              }}
            >
              {slide.points.map((p) => (
                <li
                  key={p}
                  style={{
                    fontSize: 12,
                    color: "var(--proof-text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <CheckCircle2 size={12} color={slide.color} style={{ flexShrink: 0 }} />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Filmstrip nav */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            overflowX: "auto",
            padding: "4px 0",
          }}
        >
          {slides.map((s, i) => {
            const StripIcon = ICON_MAP[s.icon];
            const isActive = i === idx;
            return (
              <div
                key={s.id}
                onClick={() => setIdx(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                  border: isActive ? `2px solid ${s.color}` : "2px solid transparent",
                  background: isActive ? s.color + "12" : "transparent",
                  flexShrink: 0,
                  transition: "all 0.15s",
                  userSelect: "none",
                  fontSize: 11,
                  color: "var(--proof-text-secondary)",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: s.color,
                    flexShrink: 0,
                  }}
                />
                <StripIcon size={12} style={{ flexShrink: 0 }} />
                <span
                  style={{
                    whiteSpace: "nowrap",
                    maxWidth: 80,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Nav controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <button onClick={() => setIdx((prev) => (prev - 1 + total) % total)} style={navBtnStyle}>
            <ChevronLeft size={14} />
          </button>
          <div style={{ display: "flex", gap: 6 }}>
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIdx(i)}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  border: "none",
                  cursor: "pointer",
                  background: i === idx ? slide.color : "var(--proof-grey)",
                  padding: 0,
                  transition: "background 0.2s",
                }}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
          <button onClick={() => setIdx((prev) => (prev + 1) % total)} style={navBtnStyle}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </>
  );
}

const navBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  border: "1px solid var(--proof-grey)",
  borderRadius: 6,
  background: "transparent",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--proof-text-secondary)",
};

const DOC_SECTIONS: DocEntry[] = [
  {
    id: "quickstart",
    icon: "🚀",
    number: "1",
    title: "Quick Start",
    content: () => (
      <>
        <p>
          <strong>A.W.A.R.E.</strong> is a web-based observability dashboard for your GitHub Actions
          test pipeline. It runs entirely in your browser — no backend or API setup needed.
        </p>
        <ol style={{ paddingLeft: 18, margin: "8px 0" }}>
          <li>
            <strong>Open the Dashboard</strong> (<code>/</code>) — See pass-rate charts per
            environment, run frequency, recent alerts, and promotion status at a glance.
          </li>
          <li>
            <strong>Browse Runs</strong> (<code>/runs</code>) — Explore past test runs. Click any
            run to see individual test results and evidence.
          </li>
          <li>
            <strong>Compare a Promotion</strong> (<code>/compare</code>) — Pick a baseline vs
            candidate run. Review regressions, fixed tests, and approve or block the promotion.
          </li>
          <li>
            <strong>Manage Tests</strong> (<code>/suites</code>) — View test cases, browse suites,
            and download the full test registry.
          </li>
          <li>
            <strong>Organize Suites</strong> (<code>/suites</code>) — Group test cases into suites
            with YAML export. Build a tree hierarchy for your test categories.
          </li>
        </ol>
      </>
    ),
  },
  {
    id: "walkthrough",
    icon: "🗺️",
    number: "2",
    title: "Page-by-Page Walkthrough",
    content: () => (
      <DocTable
        headers={["Page", "Path", "What to do here"]}
        rows={[
          [
            "Dashboard",
            "/",
            "Monitor pass rates across environments. Check the Run Frequency chart to see test cadence. The Env Health card shows alerts. Use CTA stat cards to jump to runs, compare, or analytics.",
          ],
          [
            "Runs",
            "/runs",
            "Filter runs by environment, network, or status via the FilterBar. Click a row for the side panel with full run details, test results, and evidence. Use the export/share buttons. Click 'Start New Run' to configure and dispatch a regression suite via GitHub Actions.",
          ],
          [
            "Run Detail",
            "/runs/:id",
            "Drill into a specific run. See pass/fail breakdown per test. Click evidence rows to expand assertions. Use the panel to navigate to related analytics or compare views.",
          ],
          [
            "Compare",
            "/compare",
            "Select baseline and candidate runs from the dropdowns. The diff table shows regressions, fixes, duration changes. Click a row for the side panel. Use column filters (status, env, duration). The green banner shows promotion readiness.",
          ],
          [
            "Test Suites",
            "/suites",
            "Browse and organize test cases within suites. View test metadata, category distribution, and priority breakdown. Export the full test registry as JSON, CSV, or JUnit XML.",
          ],
          [
            "Test Suites",
            "/suites",
            "Tree view of all suites. Click to edit suite metadata, manage test membership, and export as YAML. Use Add Tests modal to bulk-add from the full test list.",
          ],
          [
            "Test Analytics",
            "/analytics",
            "Pass-rate trend chart and flakiness analysis for a specific test. Accepts <code>?testId=tc_N</code> or <code>?diffId=diff_N</code> params. CTA cards link to run history and comparisons.",
          ],
          [
            "Test Doc",
            "/testdoc",
            "Three-column layout: top bar with test metadata, sidebar with related tests and changelog, main area for documentation. Good for reviewing test intent and history.",
          ],
          [
            "Copilot",
            "/copilot",
            "AI chat with 5 built-in skills. Select a provider (OpenAI/WebLLM/Chrome Built-in AI) in the config panel. Use skills to generate tests, write scripts, analyze results, explain diffs, or create suites. Chat history persists in localStorage.",
          ],
          [
            "Status",
            "/status",
            "System health overview. See environment statuses, service uptime indicators, and recent incidents.",
          ],
          [
            "Sharing",
            "/sharing",
            "Permalink viewer. Past a sharing link or ID to load a saved comparison or run view.",
          ],
          [
            "CI Pipeline",
            "/ci-pipeline",
            "Architecture diagram of the GitHub Actions integration. Shows how test runs flow from PR → CI → Results → Dashboard.",
          ],
        ]}
      />
    ),
  },
  {
    id: "workflows",
    icon: "🔄",
    number: "3",
    title: "Daily Operator Workflows",
    content: () => (
      <>
        <p>
          <strong>Morning Check:</strong> Open Dashboard → check pass-rate trends. If an env is
          dipping, click the stat card to jump to Runs filtered by that env. Identify failing tests
          and investigate in Run Detail.
        </p>
        <p>
          <strong>Promotion Review:</strong> Go to Compare → select the candidate run. Scan the diff
          table for regressions. Use column filters to isolate failed tests. If all clear, click
          "Approve Promotion". If blocked, file GitHub issues from the regression list.
        </p>
        <p>
          <strong>Adding a Test Case:</strong> Go to Test Manager → click "+ New Test Case". Fill in
          the Basic Info tab (name, category, priority, severity). Switch to the HTTP tab to set
          URL, method, headers, and expected status. Add Predicates (response time, status code,
          header checks) in the Predicates tab. Review in Docs tab. Save.
        </p>
        <p>
          <strong>Bulk Import:</strong> Go to Test Manager → click "Import". Drop a JSON, YAML, or
          JUnit XML file. The app auto-detects the format. Review the parsed tests and confirm. All
          imported cases appear in the table immediately.
        </p>
        <p>
          <strong>Investigating a Regression:</strong> Find the regression in Compare → click the
          row to open the side panel. Click "View in Analytics" to see historical pass rate. Click
          "View in Run Detail" to see the specific failure evidence. File an issue from the side
          panel.
        </p>
        <p>
          <strong>Using AI Copilot:</strong> Go to Copilot → select a skill (e.g. "Generate Tests").
          Describe what you need. The AI returns structured test configs with a form. Fill in
          remaining fields and click "Confirm & Open in Test Manager" to save.
        </p>
      </>
    ),
  },
  {
    id: "charts",
    icon: "📈",
    number: "4",
    title: "Understanding Charts & Metrics",
    content: () => (
      <>
        <p>
          <strong>Pass Rate by Environment</strong> (Dashboard) — Area chart showing daily pass
          rates for each env. A dip indicates regressions. Hover points to see exact values. Click a
          point to navigate to that run.
        </p>
        <p>
          <strong>Aggregate by Day</strong> (Dashboard) — Grouped bar chart of pass/fail counts per
          day. Use this to spot volume trends — are more tests running? Are failure days clustered?
        </p>
        <p>
          <strong>Run Frequency</strong> (Dashboard) — Shows runs per day with env-distributed bar
          segments. The "Totals by Env" column shows env-level run counts. Gaps (days without runs)
          are shown in red below the chart. Avg interval hours help you understand test cadence.
        </p>
        <p>
          <strong>Test Analytics Charts</strong> — Per-test pass rate line chart + flakiness score
          (how often a test flips between pass/fail). A flaky test needs investigation even if its
          pass rate is high.
        </p>
        <p>
          <strong>Stat Cards</strong> — Clickable cards that act as shortcuts. "Pass Rate" goes to
          Dashboard, "Runs This Week" goes to Runs, "Active Regressions" goes to Compare filtered,
          etc. Each card shows a sub-label with more context.
        </p>
      </>
    ),
  },
  {
    id: "testcases",
    icon: "🧪",
    number: "5",
    title: "Working with Test Cases",
    content: () => (
      <>
        <p>
          <strong>Test Case Fields:</strong>
        </p>
        <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
          <li>
            <strong>Basic Info</strong> — name, description, category (caching, routing, security,
            etc.), priority (P0-P3), severity, status (active/draft/archived), owner, tags,
            automated flag
          </li>
          <li>
            <strong>HTTP Config</strong> — URL, method (GET/POST/PUT/DELETE), headers, request body,
            expected status code
          </li>
          <li>
            <strong>Predicates</strong> — Validation rules: status code equals, response time less
            than, header contains, body matches regex, etc. Each has type, field, expected value,
            operator, and description
          </li>
          <li>
            <strong>Filmstrip</strong> — Visual comparison snapshots: enabled/disabled, similarity
            threshold (0-1)
          </li>
          <li>
            <strong>Docs</strong> — Free-text documentation, preconditions, expected behavior
          </li>
          <li>
            <strong>Changelog</strong> — Auto-generated version history with author, timestamp, and
            change summary
          </li>
        </ul>
        <p>
          <strong>Bulk Actions:</strong> Select multiple tests via checkboxes → choose action from
          the toolbar: delete, set status (active/draft/archived), set priority (P0-P3), add to
          suite (opens suite picker modal).
        </p>
        <p>
          <strong>Import Formats:</strong> JSON array of test case objects, YAML with test case
          definitions (auto-detected by extension or content inspection), JUnit XML (parses test
          case results as test case definitions).
        </p>
        <p>
          <strong>Export Formats:</strong> JSON (full test case objects), CSV (flat table with key
          fields), JUnit XML (test suite structure).
        </p>
        <p>
          <strong>Suites:</strong> Create a suite with a name, description, and optional parent (for
          tree nesting). Add tests to suites via the Add Tests modal. Export suites as YAML for CI
          integration.
        </p>
      </>
    ),
  },
  {
    id: "filtering",
    icon: "🔍",
    number: "6",
    title: "Filtering & Navigation Tips",
    content: () => (
      <>
        <p>
          <strong>Every table has:</strong> Search bar (filters by name/description), column
          visibility toggle (eye icon), sortable columns (click header to sort).
        </p>
        <p>
          <strong>Compare page:</strong> "Regressions only" checkbox filters the table to show only
          regressions. Column dropdowns let you filter by specific status/environment/duration
          ranges.
        </p>
        <p>
          <strong>Runs page:</strong> FilterBar at top lets you filter by environment, network
          (production/staging), and status. The date range picker filters runs by timeframe.
        </p>
        <p>
          <strong>Side panels:</strong> Click any row in Compare or Runs to open a detail panel. The
          panel has tabs (details, evidence, related) and action buttons (view analytics, file
          issue, share).
        </p>
        <p>
          <strong>Keyboard shortcuts:</strong> Ctrl+K / Cmd+K opens the Command Palette for quick
          navigation between pages.
        </p>
        <p>
          <strong>SPA vs Full Nav:</strong> The app uses wouter for client-side routing. Links
          within the app use SPA navigation (instant, no page reload). The <code>navTo()</code>{" "}
          function triggers a full page reload — used for external navigation or reset operations.
        </p>
      </>
    ),
  },
  {
    id: "environments",
    icon: "🌐",
    number: "7",
    title: "Environment Configuration",
    content: () => (
      <>
        <p>
          The app ships with 3 environment targets: <strong>QA</strong>, <strong>UAT</strong>, and{" "}
          <strong>PROD</strong>. Each environment has:
        </p>
        <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
          <li>
            <strong>Base URL</strong> — The endpoint used for test requests
          </li>
          <li>
            <strong>Target</strong> — Logical grouping (Prod, UAT)
          </li>
          <li>
            <strong>Network</strong> — Network tier (production, staging)
          </li>
          <li>
            <strong>IP Addresses</strong> — Optional list of IPs for network-level filtering
          </li>
        </ul>
        <p>
          Edit environments in the Dashboard via the <strong>Env Config</strong> panel (gear icon).
          Changes persist in localStorage. Reset to defaults with the "Reset" button in the panel.
        </p>
        <p>
          Each environment gets its own pass-rate tracking in charts. Compare behavior across envs
          to catch staging-only regressions before they reach production.
        </p>
      </>
    ),
  },
  {
    id: "copilot",
    icon: "🤖",
    number: "8",
    title: "AI Copilot Guide",
    content: () => (
      <>
        <p>
          <strong>Providers:</strong>
        </p>
        <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
          <li>
            <strong>Chrome Built-in AI</strong> — Uses Gemini Nano via Chrome's LanguageModel API.
            Requires Chrome 148+. No API key needed.
          </li>
          <li>
            <strong>OpenAI</strong> — Connects to any OpenAI-compatible API (OpenAI, Azure, local
            LLMs). Requires <code>apiKey</code> and optional <code>apiUrl</code> (defaults to
            OpenAI). Configure model, temperature, max tokens.
          </li>
          <li>
            <strong>WebLLM</strong> — Runs a model in-browser via WebGPU. Requires Chrome with
            WebGPU support and the <code>@mlc-ai/web-llm</code> package. Shows "not available"
            message when unsupported.
          </li>
        </ul>
        <p>
          <strong>5 Built-in Skills:</strong>
        </p>
        <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
          <li>
            <strong>Generate Tests</strong> — "Create a cache validation test for CDN edge." Returns
            a structured config with predicates, filmstrip, and changelog. Review the card and
            confirm to save in Test Manager.
          </li>
          <li>
            <strong>Generate Script</strong> — "Write a YAML test script for a geo-routing check."
            Returns a portable YAML test definition.
          </li>
          <li>
            <strong>Analyze Results</strong> — "My pass rate dropped in UAT." Returns regression
            analysis with root cause suggestions.
          </li>
          <li>
            <strong>Explain Diff</strong> — "Compare the last two production runs." Returns a
            structured comparison of regressions, fixes, and duration changes.
          </li>
          <li>
            <strong>Generate Suite</strong> — "Create a security test suite." Returns a suite
            configuration with integrations and test selection criteria.
          </li>
        </ul>
        <p>
          <strong>Chat Tips:</strong> The AI remembers the last 50 messages in the conversation. Use
          clear, specific descriptions. You can include category, priority, status codes, and test
          names in your request — the AI extracts these automatically. Switch skills
          mid-conversation to change the AI's behavior.
        </p>
        <p>
          <strong>Config Panel:</strong> Access via the gear icon on the Copilot page. Change
          provider, enter API key, set model/temperature/max tokens. Config persists in
          localStorage.
        </p>
      </>
    ),
  },
  {
    id: "datalifecycle",
    icon: "💾",
    number: "9",
    title: "Data Lifecycle & Storage",
    content: () => (
      <>
        <p>
          <strong>All data lives in your browser's localStorage.</strong> There is no server
          backend. Data persists across page refreshes and browser restarts. Clearing browser
          storage or using incognito with a fresh session will reset all data to defaults.
        </p>
        <DocTable
          headers={["Storage Key", "What it stores"]}
          rows={[
            ["aware_test_cases_v2", "All test cases (CRUD operations)"],
            ["aware_test_suites_v2", "Test suites tree structure"],
            ["aware_promotion_decisions", "Promotion approve/block records per run"],
            ["proof_env_configs", "Environment targets and IP configs"],
            ["aware_copilot_chat", "Copilot chat message history"],
            ["aware_pending_test_config", "In-flight test config being confirmed in Copilot"],
            ["aware_carousel_templates", "Saved carousel slide templates (About page)"],
          ]}
        />
        <p>
          <strong>Reset:</strong> Use the "Reset All Data" option in the Dashboard to clear test
          cases, suites, and promotion decisions. Individual resets are available for env configs
          and chat history.
        </p>
        <p>
          <strong>Data:</strong> Auto-discovered tests from CI pipeline. Currently {RUNS.length}{" "}
          runs and {DIFF_ROWS.length} diff rows loaded.
        </p>
      </>
    ),
  },
  {
    id: "troubleshooting",
    icon: "❓",
    number: "10",
    title: "Troubleshooting & FAQ",
    content: () => (
      <>
        <p>
          <strong>Q: My changes disappeared after refresh.</strong>
          <br />
          A: localStorage only persists on the same browser/device. If you cleared site data or
          switched browsers, data resets. Export your test cases before clearing storage.
        </p>
        <p>
          <strong>Q: The Copilot says "API Error 401".</strong>
          <br />
          A: Your OpenAI API key is invalid or missing. Go to the Copilot config panel and set a
          valid key.
        </p>
        <p>
          <strong>Q: Charts show no data.</strong>
          <br />
          A: Ensure CI pipeline runs are populating the data store. Check that your GitHub Actions
          workflow is pushing results to the configured endpoints.
        </p>
        <p>
          <strong>Q: I accidentally deleted a test case.</strong>
          <br />
          A: There's no undo. Export your test cases regularly via the Export button in Test Manager
          as a backup.
        </p>
        <p>
          <strong>Q: How do I add real GitHub Actions data?</strong>
          <br />
          A: Configure your CI pipeline to push results to the data endpoints. The <code>
            RUNS
          </code>{" "}
          and <code>DIFF_ROWS</code> modules in <code>lib/</code> load data from JSON seed files
          committed in the repo.
        </p>
        <p>
          <strong>Q: The Compare page shows no runs in the dropdown.</strong>
          <br />
          A: You need at least 2 runs to compare. Currently there are {RUNS.length} runs loaded.
        </p>
        <p>
          <strong>Q: WebLLM shows "Not Available".</strong>
          <br />
          A: WebLLM requires Chrome with WebGPU support. Check <code>chrome://gpu</code> for WebGPU
          availability. The <code>@mlc-ai/web-llm</code> package must be installed.
        </p>
      </>
    ),
  },
  {
    id: "architecture",
    icon: "🏗️",
    number: "11",
    title: "Architecture",
    content: () => (
      <>
        <p>
          The app lives in <code>artifacts/aware-app/src/</code>. Everything is split into three
          folders:
        </p>
        <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
          <li>
            <strong>
              <code>lib/</code>
            </strong>{" "}
            — data layer: types, store, helpers
          </li>
          <li>
            <strong>
              <code>pages/</code>
            </strong>{" "}
            — one file per route (Dashboard, Runs, Compare, etc.)
          </li>
          <li>
            <strong>
              <code>components/</code>
            </strong>{" "}
            — reusable UI pieces: <code>aware/</code> for app-specific, <code>ui/</code> for shadcn
          </li>
        </ul>
        <p>
          <strong>Core rule:</strong> Pages import from <code>@/lib/data</code> (a barrel file).
          Never import directly from <code>lib/</code> sub-modules.
        </p>
      </>
    ),
  },
  {
    id: "dataflow",
    icon: "🔄",
    number: "12",
    title: "Data Flow",
    content: () => (
      <>
        <p>
          <strong>Page → lib/data → store → localStorage</strong>
        </p>
        <p>
          Every page calls functions from <code>@/lib/data</code> to read or write data. For
          example:
        </p>
        <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
          <li>
            <code>getTestCases()</code> — returns all test cases from the store
          </li>
          <li>
            <code>createTestCase(data)</code> — adds a new test case, saves to localStorage
          </li>
          <li>
            <code>getTestResultsForRun(runId)</code> — returns test results for a run from CI data
          </li>
          <li>
            <code>getRunById(id)</code> — looks up a single run
          </li>
        </ul>
        <p>
          When data changes, the store calls <code>_notify()</code> which triggers listeners, so any
          component using <code>useTestData()</code> re-renders automatically.
        </p>
      </>
    ),
  },
  {
    id: "development",
    icon: "🧑‍💻",
    number: "13",
    title: "Development",
    content: () => (
      <>
        <p>
          <strong>Commands:</strong>
        </p>
        <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
          <li>
            <code>cd artifacts/aware-app</code>
          </li>
          <li>
            <code>pnpm install</code> — install dependencies
          </li>
          <li>
            <code>pnpm dev</code> — start dev server at <code>:5173</code>
          </li>
          <li>
            <code>pnpm build</code> — production build to <code>dist/public/</code>
          </li>
          <li>
            <code>pnpm run typecheck</code> — TypeScript check (must pass before committing)
          </li>
        </ul>
        <p>
          <strong>How to add a new page:</strong>
        </p>
        <ol style={{ paddingLeft: 18, margin: "8px 0" }}>
          <li>
            Create a file in <code>pages/</code> (e.g. <code>MyNewPage.tsx</code>)
          </li>
          <li>
            Import <code>AppLayout</code> from <code>@/components/aware/AppLayout</code>
          </li>
          <li>
            Wrap your content in <code>{'<AppLayout activeHref="/my-path">'}</code>
          </li>
          <li>
            Add a route in <code>App.tsx</code>:{" "}
            <code>{'<Route path="/my-path" component={MyNewPage} />'}</code>
          </li>
          <li>
            Add a nav item in <code>AppLayout.tsx</code> (the <code>NAV_ITEMS</code> array)
          </li>
        </ol>
        <p>
          <strong>Design Rules:</strong>
        </p>
        <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
          <li>
            All pages use inline <code>style={}</code> — NOT Tailwind classes
          </li>
          <li>
            CSS variables like <code>var(--proof-blue)</code> are defined in <code>_group.css</code>
          </li>
          <li>
            Script paths use <code>.yaml</code> extension
          </li>
          <li>
            Use wouter's <code>useLocation()</code> for SPA navigation
          </li>
          <li>
            Charts use Google Charts (wrappers in <code>GoogleCharts.tsx</code>)
          </li>
          <li>
            Typecheck must pass before committing: <code>pnpm run typecheck</code>
          </li>
        </ul>
      </>
    ),
  },
];

export default function About() {
  const features = [
    {
      icon: BarChart3,
      title: "Dashboard",
      desc: "Promotion readiness overview with per-environment pass rates, regression alerts, and version drift tracking.",
    },
    {
      icon: Activity,
      title: "Run History",
      desc: "Full history of GitHub Actions test runs with filtering, side-panel detail, Slack sharing, and export.",
    },
    {
      icon: GitCompare,
      title: "Regression Compare",
      desc: "Baseline vs candidate diff with per-test side panel, column filters, permalink sharing, and GitHub issue filing.",
    },
    {
      icon: Bug,
      title: "Test Manager",
      desc: "CRUD for test cases with tabbed form (Basic Info, Docs, HTTP & Predicates), filmstrip visual comparison, bulk import/export, and AI generation.",
    },
    {
      icon: Shield,
      title: "Security & DDoS",
      desc: "WAF validation, rate limiting, TLS negotiation, and DDoS mitigation test suites built into the test registry.",
    },
    {
      icon: Globe,
      title: "Full Coverage",
      desc: "Geo-match, locale-split, caching, routing, and config test categories covering the full web application deployment surface.",
    },
  ];

  const stack = [
    ["React 19 + Vite 7", "SPA with fast HMR"],
    ["Tailwind CSS 4 / GCP CSS vars", "Design tokens matching Google Cloud Console"],
    ["Google Charts", "Pass-rate and analytics charts"],
    ["Wouter", "Lightweight SPA routing"],
    ["localStorage", "Client-side persistence for test registry"],
    ["Lucide React", "Icon system"],
  ];

  const [showDocs, setShowDocs] = React.useState(false);

  return (
    <AppLayout>
      <div className="proof-page" style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Hero */}
        <div
          className="proof-card"
          style={{
            padding: "36px 40px",
            marginBottom: 24,
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(135deg, rgba(91,138,245,0.1) 0%, rgba(124,106,245,0.06) 50%, var(--proof-surface) 100%)",
            borderTop: "2px solid rgba(91,138,245,0.5)",
          }}
        >
          {/* Decorative glow blob */}
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(91,138,245,0.12) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ display: "flex", alignItems: "flex-start", gap: 22, position: "relative" }}>
            <div
              style={{
                width: 60,
                height: 60,
                background: "linear-gradient(135deg, #4a7af5 0%, #7c6af5 100%)",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 4px 20px rgba(91,138,245,0.35)",
              }}
            >
              <Zap size={28} color="white" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                <h1
                  style={{
                    fontSize: 30,
                    fontWeight: 900,
                    color: "var(--proof-text)",
                    letterSpacing: "-1px",
                    lineHeight: 1,
                  }}
                >
                  A.W.A.R.E.
                </h1>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--proof-text-secondary)",
                    letterSpacing: "0.05em",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  v2.0.0
                </span>
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--proof-text-secondary)",
                  lineHeight: 1.7,
                  maxWidth: 580,
                  marginBottom: 16,
                }}
              >
                <strong style={{ color: "var(--proof-text)" }}>
                  Akamai Web Analytics Regression Engine
                </strong>{" "}
                — a CDN test observability dashboard for Playwright + pytest suites across QA, UAT,
                and PROD Akamai environments. Surface pass-rate trends, compare regressions, and
                gate promotions with confidence.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { label: "GHA Observability", color: "#5b8af5" },
                  { label: "Regression Testing", color: "#22c55e" },
                  { label: "Promotion Gating", color: "#f59e0b" },
                  { label: "Cross-Environment", color: "#a855f7" },
                ].map(({ label, color }) => (
                  <span
                    key={label}
                    style={{
                      fontSize: 11,
                      padding: "3px 11px",
                      background: `${color}14`,
                      color,
                      borderRadius: 999,
                      fontWeight: 600,
                      border: `1px solid ${color}30`,
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* What is PROOF? — Beginner overview */}
        <div
          className="proof-card"
          style={{
            padding: 28,
            marginBottom: 24,
            background:
              "linear-gradient(135deg, rgba(91,138,245,0.06) 0%, var(--proof-surface) 100%)",
          }}
        >
          <h2
            style={{ fontSize: 20, fontWeight: 800, color: "var(--proof-text)", marginBottom: 10 }}
          >
            What is A.W.A.R.E.?
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "var(--proof-text-secondary)",
              lineHeight: 1.8,
              marginBottom: 20,
              maxWidth: 720,
            }}
          >
            <strong>A.W.A.R.E.</strong> is a web dashboard that tracks your Akamai CDN test health
            after every code change. When your automated tests run (via GitHub Actions), A.W.A.R.E.
            shows you which tests passed, which failed, and whether it's safe to promote — across
            QA, UAT, and PROD Akamai environments.
          </p>

          {/* Architecture flow as SVG */}
          <div
            style={{
              margin: "16px 0",
              display: "flex",
              justifyContent: "center",
              overflow: "auto",
            }}
          >
            <svg
              width="660"
              height="140"
              viewBox="0 0 660 140"
              style={{ maxWidth: "100%", display: "block" }}
            >
              <defs>
                <marker
                  id="archArrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto"
                >
                  <path d="M0 0 L10 5 L0 10 Z" fill="#9aa0a6" />
                </marker>
              </defs>
              <rect
                x="10"
                y="45"
                width="170"
                height="60"
                rx="8"
                fill="rgba(91,138,245,0.1)"
                stroke="#5b8af5"
                strokeWidth="1.5"
              />
              <text
                x="95"
                y="70"
                textAnchor="middle"
                fontSize="13"
                fontWeight="bold"
                fill="#e8eaed"
                fontFamily="system-ui, sans-serif"
              >
                🤖 GitHub Actions
              </text>
              <text
                x="95"
                y="88"
                textAnchor="middle"
                fontSize="10"
                fill="#9aa0a6"
                fontFamily="system-ui, sans-serif"
              >
                Automated test runner
              </text>

              <path
                d="M180 75 L225 75"
                stroke="#9aa0a6"
                strokeWidth="1.5"
                markerEnd="url(#archArrow)"
              />
              <text
                x="202"
                y="65"
                textAnchor="middle"
                fontSize="9"
                fill="#5b8af5"
                fontFamily="system-ui, sans-serif"
              >
                triggers
              </text>

              <rect
                x="235"
                y="45"
                width="170"
                height="60"
                rx="8"
                fill="rgba(34,197,94,0.1)"
                stroke="#22c55e"
                strokeWidth="1.5"
              />
              <text
                x="320"
                y="70"
                textAnchor="middle"
                fontSize="13"
                fontWeight="bold"
                fill="#e8eaed"
                fontFamily="system-ui, sans-serif"
              >
                🌐 A.W.A.R.E. Portal
              </text>
              <text
                x="320"
                y="88"
                textAnchor="middle"
                fontSize="10"
                fill="#9aa0a6"
                fontFamily="system-ui, sans-serif"
              >
                Browser-based dashboard
              </text>

              <path
                d="M405 75 L450 75"
                stroke="#9aa0a6"
                strokeWidth="1.5"
                markerEnd="url(#archArrow)"
              />
              <text
                x="427"
                y="65"
                textAnchor="middle"
                fontSize="9"
                fill="#5b8af5"
                fontFamily="system-ui, sans-serif"
              >
                displays
              </text>

              <rect
                x="460"
                y="45"
                width="190"
                height="60"
                rx="8"
                fill="#5b8af5"
                stroke="#5b8af5"
                strokeWidth="1.5"
              />
              <text
                x="555"
                y="70"
                textAnchor="middle"
                fontSize="13"
                fontWeight="bold"
                fill="white"
                fontFamily="system-ui, sans-serif"
              >
                📊 Insights &amp; Actions
              </text>
              <text
                x="555"
                y="88"
                textAnchor="middle"
                fontSize="10"
                fill="rgba(232,234,237,0.8)"
                fontFamily="system-ui, sans-serif"
              >
                Compare · Promote · Analyze
              </text>
            </svg>
          </div>

          <p
            style={{
              fontSize: 12,
              color: "var(--proof-text-secondary)",
              lineHeight: 1.6,
              margin: "8px 0 16px",
              fontStyle: "italic",
              textAlign: "center",
            }}
          >
            Data lives entirely in your browser — no servers, no setup, no sign-up.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            <div
              style={{
                textAlign: "center",
                padding: 16,
                background: "var(--proof-surface)",
                borderRadius: 8,
                border: "1px solid var(--proof-grey)",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>🔁</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--proof-text)",
                  marginBottom: 4,
                }}
              >
                Code Change
              </div>
              <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", lineHeight: 1.5 }}>
                Developer pushes code → automated tests run
              </div>
            </div>
            <div
              style={{
                textAlign: "center",
                padding: 16,
                background: "var(--proof-surface)",
                borderRadius: 8,
                border: "1px solid var(--proof-grey)",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>📈</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--proof-text)",
                  marginBottom: 4,
                }}
              >
                See Results
              </div>
              <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", lineHeight: 1.5 }}>
                Dashboard shows pass/fail rates per environment
              </div>
            </div>
            <div
              style={{
                textAlign: "center",
                padding: 16,
                background: "var(--proof-blue)",
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>🚀</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 4 }}>
                Deploy or Block
              </div>
              <div style={{ fontSize: 11, color: "rgba(232,234,237,0.8)", lineHeight: 1.5 }}>
                Compare baseline vs candidate — approve or block deployment
              </div>
            </div>
          </div>
        </div>

        {/* Use Case Carousel */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div
            style={{
              width: 3,
              height: 18,
              borderRadius: 2,
              background: "linear-gradient(180deg, #f59e0b 0%, #f97316 100%)",
            }}
          />
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--proof-text)", margin: 0 }}>
            Use Cases
          </h2>
        </div>
        <div
          className="proof-card"
          style={{ padding: 24, marginBottom: 24, position: "relative", overflow: "hidden" }}
        >
          <CarouselSlides />
        </div>

        {/* Features grid */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div
            style={{
              width: 3,
              height: 18,
              borderRadius: 2,
              background: "linear-gradient(180deg, #5b8af5 0%, #7c6af5 100%)",
            }}
          />
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--proof-text)", margin: 0 }}>
            Platform Features
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 14,
            marginBottom: 32,
          }}
        >
          {features.map((f, idx) => {
            const Icon = f.icon;
            const iconColors = ["#5b8af5", "#22c55e", "#f59e0b", "#a855f7", "#ef4444", "#f97316"];
            const color = iconColors[idx % iconColors.length];
            return (
              <div
                key={f.title}
                className="proof-card"
                style={{
                  padding: 18,
                  display: "flex",
                  gap: 14,
                  borderTop: `2px solid ${color}40`,
                  background: `linear-gradient(160deg, ${color}07 0%, var(--proof-surface) 100%)`,
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderTopColor = `${color}80`;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 20px ${color}18`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderTopColor = `${color}40`;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "";
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    background: `${color}18`,
                    borderRadius: 9,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: `1px solid ${color}25`,
                  }}
                >
                  <Icon size={17} style={{ color }} />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 13,
                      marginBottom: 4,
                      color: "var(--proof-text)",
                    }}
                  >
                    {f.title}
                  </div>
                  <div
                    style={{ fontSize: 12, color: "var(--proof-text-secondary)", lineHeight: 1.55 }}
                  >
                    {f.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tech stack */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div
            style={{
              width: 3,
              height: 18,
              borderRadius: 2,
              background: "linear-gradient(180deg, #a855f7 0%, #5b8af5 100%)",
            }}
          />
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--proof-text)", margin: 0 }}>
            Tech Stack
          </h2>
        </div>
        <div className="proof-card" style={{ overflow: "hidden", marginBottom: 28 }}>
          <table className="proof-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Technology</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {stack.map(([tech, role]) => (
                <tr key={tech}>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600 }}>
                    {tech}
                  </td>
                  <td style={{ color: "var(--proof-text-secondary)", fontSize: 12 }}>{role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Project Documentation toggle */}
        <div style={{ marginBottom: 28 }}>
          <button
            onClick={() => setShowDocs(!showDocs)}
            className="proof-card"
            style={{
              width: "100%",
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              border: "none",
              cursor: "pointer",
              background: "var(--proof-blue-bg)",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--proof-blue)",
            }}
          >
            <Book size={18} />
            <span style={{ flex: 1, textAlign: "left" }}>
              {showDocs
                ? "Hide Project Documentation"
                : "📖 View Project Documentation — how this app works"}
            </span>
            <ChevronDown
              size={16}
              style={{
                transform: showDocs ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            />
          </button>

          {showDocs && <DocViewer sections={DOC_SECTIONS} />}
        </div>

        {/* CTA */}
        <div
          style={{
            padding: "28px 32px",
            borderRadius: 12,
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(135deg, rgba(91,138,245,0.14) 0%, rgba(124,106,245,0.10) 50%, rgba(19,23,40,0.8) 100%)",
            border: "1px solid rgba(91,138,245,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: -40,
              left: -40,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(124,106,245,0.1) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative" }}>
            <div
              style={{ fontWeight: 800, fontSize: 16, marginBottom: 5, letterSpacing: "-0.3px" }}
            >
              Ready to explore?
            </div>
            <div style={{ fontSize: 13, color: "var(--proof-text-secondary)", lineHeight: 1.5 }}>
              Start with the Dashboard for a pass-rate summary, or dive into the Test Manager to
              manage your suite.
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexShrink: 0, position: "relative" }}>
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 20px",
                background: "linear-gradient(135deg, #5b8af5 0%, #7c6af5 100%)",
                color: "white",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                textDecoration: "none",
                boxShadow: "0 2px 12px rgba(91,138,245,0.35)",
              }}
            >
              <BarChart3 size={14} /> Dashboard
            </Link>
            <Link
              href="/suites"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 20px",
                border: "1px solid rgba(91,138,245,0.4)",
                color: "var(--proof-blue)",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                textDecoration: "none",
                background: "rgba(91,138,245,0.1)",
              }}
            >
              <Bug size={14} /> Test Manager
            </Link>
          </div>
        </div>

        <div
          style={{
            marginTop: 20,
            fontSize: 11,
            color: "var(--proof-text-secondary)",
            textAlign: "center",
          }}
        >
          A.W.A.R.E. — Akamai Web Analytics Regression Engine · v2.0.0 · CDN Observability Platform
        </div>
      </div>
    </AppLayout>
  );
}
