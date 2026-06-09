import React from "react";
import Fuse from "fuse.js";
import { useLocation } from "wouter";
import { getTestCases, getTestSuites, RUNS, DIFF_ROWS } from "@/lib/data";

type SearchResult = {
  id: string;
  label: string;
  description: string;
  type: "test" | "run" | "compare" | "suite";
  href: string;
  icon: string;
};

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const [, navigate] = useLocation();
  const testCases = getTestCases();
  const suites = getTestSuites();

  const ALL_RESULTS: SearchResult[] = [
    ...suites.map((s) => ({
      id: s.id,
      label: s.name,
      description: `${s.testIds.length} tests · ${s.config.target}/${s.config.environment}`,
      type: "suite" as const,
      href: "/tests",
      icon: "📁",
    })),
    ...testCases.slice(0, 30).map((tc) => ({
      id: tc.id,
      label: tc.name,
      description: `${tc.category} · ${tc.priority} · ${tc.status}`,
      type: "test" as const,
      href: `/tests`,
      icon: "🧪",
    })),
    ...RUNS.map((r) => ({
      id: r.id,
      label: r.id,
      description: `${r.label} · ${r.passPct}% pass · ${r.status}`,
      type: "run" as const,
      href: `/runs/${r.id}`,
      icon: "▶",
    })),
    ...DIFF_ROWS.slice(0, 8).map((d) => ({
      id: `compare_${d.id}`,
      label: d.name,
      description: `baseline vs candidate · ${d.state}`,
      type: "compare" as const,
      href: `/compare`,
      icon: "⇄",
    })),
    {
      id: "nav_dash",
      label: "Dashboard",
      description: "Promotion readiness overview",
      type: "run" as const,
      href: "/",
      icon: "📊",
    },
    {
      id: "nav_runs",
      label: "All Runs",
      description: "GitHub Actions test run history",
      type: "run" as const,
      href: "/runs",
      icon: "📋",
    },
    {
      id: "nav_compare",
      label: "Compare Runs",
      description: "Baseline vs candidate diff",
      type: "compare" as const,
      href: "/compare",
      icon: "⇄",
    },
    {
      id: "nav_start",
      label: "New Run",
      description: "Trigger a regression test suite",
      type: "run" as const,
      href: "/start",
      icon: "▶",
    },
    {
      id: "nav_copilot",
      label: "Copilot",
      description: "AI assistant for tests and analysis",
      type: "run" as const,
      href: "/copilot",
      icon: "🤖",
    },
    {
      id: "nav_ci",
      label: "CI Pipeline",
      description: "Architecture and CI/CD reference",
      type: "run" as const,
      href: "/ci-pipeline",
      icon: "⚙️",
    },
    {
      id: "nav_about",
      label: "About PROOF",
      description: "Platform information and tech stack",
      type: "run" as const,
      href: "/about",
      icon: "ℹ",
    },
  ];

  const [query, setQuery] = React.useState("");
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [typeFilter, setTypeFilter] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const fuse = React.useMemo(
    () =>
      new Fuse(ALL_RESULTS, {
        keys: ["label", "description"],
        threshold: 0.3,
        includeScore: true,
      }),
    [],
  );

  const q = query.trim();
  const filtered = React.useMemo(() => {
    let items = ALL_RESULTS;
    if (typeFilter) {
      items = items.filter((r) => r.type === typeFilter);
    }
    if (!q) return items;
    return fuse
      .search(q)
      .map((r) => r.item)
      .filter((r) => !typeFilter || r.type === typeFilter);
  }, [q, typeFilter, fuse]);

  React.useEffect(() => {
    if (activeIdx >= filtered.length) setActiveIdx(0);
  }, [activeIdx, filtered.length]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && filtered[activeIdx]) {
      navigate(filtered[activeIdx].href);
      onClose();
    }
  };

  const typeCounts = { test: 0, run: 0, compare: 0, suite: 0 };
  ALL_RESULTS.forEach((r) => {
    if (r.type in typeCounts) typeCounts[r.type as keyof typeof typeCounts]++;
  });

  const typeColor = (type: string) => {
    if (type === "test") return { bg: "rgba(168,85,247,0.15)", color: "#a855f7" };
    if (type === "suite") return { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" };
    if (type === "run") return { bg: "rgba(91,138,245,0.15)", color: "#5b8af5" };
    return { bg: "rgba(34,197,94,0.15)", color: "#22c55e" };
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "12vh",
        background: "rgba(0,0,0,0.5)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          width: "min(640px, 92vw)",
          background: "var(--proof-surface)",
          borderRadius: 12,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          border: "1px solid var(--proof-grey)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 18px",
            borderBottom: "1px solid var(--proof-grey)",
          }}
        >
          <span style={{ fontSize: 16, color: "var(--proof-text-secondary)" }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tests, runs, comparisons..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 15,
              color: "var(--proof-text)",
              fontFamily: "var(--font-sans)",
            }}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
            onKeyDown={handleKey}
          />
          <kbd
            style={{
              fontSize: 11,
              padding: "2px 6px",
              background: "var(--proof-grey-bg)",
              border: "1px solid var(--proof-grey)",
              borderRadius: 4,
              color: "var(--proof-text-secondary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Filter chips */}
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: "8px 18px",
            borderBottom: "1px solid var(--proof-grey)",
            background: "var(--proof-grey-bg)",
            flexWrap: "wrap",
          }}
        >
          {(["test", "suite", "run", "compare"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? null : type)}
              style={{
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 12,
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid",
                background: typeFilter === type ? "var(--proof-blue)" : "var(--proof-surface)",
                color: typeFilter === type ? "white" : "var(--proof-text-secondary)",
                borderColor: typeFilter === type ? "var(--proof-blue)" : "var(--proof-grey)",
                transition: "all 0.15s",
              }}
            >
              {type === "test"
                ? "Tests"
                : type === "run"
                  ? "Runs"
                  : type === "compare"
                    ? "Compare"
                    : "Suites"}{" "}
              ({typeCounts[type]})
            </button>
          ))}
          {typeFilter && (
            <button
              onClick={() => setTypeFilter(null)}
              style={{
                fontSize: 11,
                padding: "3px 10px",
                color: "var(--proof-red)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "40px 18px",
                textAlign: "center",
                color: "var(--proof-text-secondary)",
                fontSize: 13,
              }}
            >
              No results for "{query}"
            </div>
          ) : (
            filtered.map((r, i) => {
              const tc = typeColor(r.type);
              return (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 18px",
                    cursor: "pointer",
                    background: i === activeIdx ? "var(--proof-blue-bg)" : "transparent",
                    transition: "background 0.1s",
                  }}
                  onClick={() => {
                    navigate(r.href);
                    onClose();
                  }}
                  onMouseEnter={() => setActiveIdx(i)}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: tc.bg,
                      color: tc.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {r.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--proof-text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.label}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--proof-text-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.description}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 7px",
                      borderRadius: 4,
                      fontWeight: 600,
                      background: tc.bg,
                      color: tc.color,
                      flexShrink: 0,
                    }}
                  >
                    {r.type}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "8px 18px",
            borderTop: "1px solid var(--proof-grey)",
            display: "flex",
            gap: 14,
            fontSize: 11,
            color: "var(--proof-text-secondary)",
          }}
        >
          {[
            ["↑↓", "Navigate"],
            ["↵", "Open"],
            ["⌘K", "Toggle"],
            ["ESC", "Close"],
          ].map(([key, label]) => (
            <span key={key}>
              <kbd
                style={{
                  padding: "1px 5px",
                  background: "var(--proof-grey-bg)",
                  border: "1px solid var(--proof-grey)",
                  borderRadius: 3,
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                }}
              >
                {key}
              </kbd>{" "}
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
