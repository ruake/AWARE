import React from "react";
import Fuse from "fuse.js";
import { useLocation } from "wouter";
import { getTestCases, getTestSuites, RUNS, DIFF_ROWS } from "@/lib/data";
import { CommandSearch } from "./CommandSearch";
import { CommandResults } from "./CommandResults";

import { motion, AnimatePresence } from "framer-motion";

export type SearchResult = {
  id: string;
  label: string;
  description: string;
  type: "test" | "run" | "compare" | "suite" | "action";
  href: string;
  icon: string;
};

const ACTION_COMMANDS: SearchResult[] = [
  {
    id: "action_run_full_suite",
    label: "> Run Full Suite",
    description: "Trigger the full Pytest test suite",
    type: "action",
    href: "/runs",
    icon: "▶",
  },
  {
    id: "action_compare_last_2",
    label: "> Compare Last 2 Runs",
    description: "Pre-fill compare page with the last two run IDs",
    type: "action",
    href: "/compare",
    icon: "⇄",
  },
  {
    id: "action_run_discovery",
    label: "> Run Discovery",
    description: "Scans test sources and merges into auto-tests.json",
    type: "action",
    href: "/runs",
    icon: "🔍",
  },
  {
    id: "action_build_app",
    label: "> Build App",
    description: "pnpm build — validates data, typechecks, produces bundle",
    type: "action",
    href: "/runs",
    icon: "📦",
  },
  {
    id: "action_run_puppeteer",
    label: "> Run Puppeteer Tests",
    description: "Run lightweight browser tests via Puppeteer",
    type: "action",
    href: "/runs",
    icon: "🎭",
  },
  {
    id: "action_run_http",
    label: "> Run HTTP Tests",
    description: "Run HTTP-level tests (health checks, security headers)",
    type: "action",
    href: "/runs",
    icon: "🌐",
  },
  {
    id: "action_share_page",
    label: "> Share Current Page",
    description: "Copy current page URL to clipboard",
    type: "action",
    href: "#",
    icon: "🔗",
  },
  {
    id: "action_go_runs",
    label: "> Go to Runs",
    description: "Navigate to the Runs page",
    type: "action",
    href: "/runs",
    icon: "📡",
  },
  {
    id: "action_go_dashboard",
    label: "> Go to Dashboard",
    description: "Navigate to the Dashboard",
    type: "action",
    href: "/",
    icon: "📊",
  },
  {
    id: "action_go_compare",
    label: "> Go to Compare",
    description: "Navigate to the Compare page",
    type: "action",
    href: "/compare",
    icon: "⇄",
  },
];

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const [, navigate] = useLocation();
  const testCases = getTestCases();
  const suites = getTestSuites();

  const ALL_RESULTS: SearchResult[] = React.useMemo(
    () => [
      ...suites.map((s) => ({
        id: s.id,
        label: s.name,
        description: `${s.testIds.length} tests · ${s.envIds.join(", ")}`,
        type: "suite" as const,
        href: "/tests",
        icon: "📁",
      })),
      ...testCases.map((tc) => ({
        id: tc.id,
        label: tc.name,
        description: `${tc.category} · ${tc.priority} · ${tc.status}`,
        type: "test" as const,
        href: `/tests?detail=${tc.id}`,
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
      ...DIFF_ROWS.map((d) => ({
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
        id: "nav_about",
        label: "About A.W.A.R.E.",
        description: "Platform information and tech stack",
        type: "run" as const,
        href: "/about",
        icon: "ℹ",
      },
      ...ACTION_COMMANDS,
    ],
    [testCases, suites],
  );

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
    [ALL_RESULTS],
  );

  const q = query.trim();
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const filtered = React.useMemo(() => {
    if (q.startsWith(">")) {
      const search = q.slice(1).trim().toLowerCase();
      if (!search) return ACTION_COMMANDS;
      return ACTION_COMMANDS.filter(
        (r) =>
          r.label.toLowerCase().includes(search) || r.description.toLowerCase().includes(search),
      );
    }
    let items = ALL_RESULTS;
    if (typeFilter) {
      items = items.filter((r) => r.type === typeFilter);
    }
    if (!q) return items;
    const results = fuse.search(q);
    return results
      .slice(0, 50)
      .map((r) => r.item)
      .filter((r) => !typeFilter || r.type === typeFilter);
  }, [q, typeFilter, fuse, ALL_RESULTS]);

  const safeActiveIdx = Math.min(activeIdx, Math.max(0, filtered.length - 1));

  const handleSelect = React.useCallback(
    (r: SearchResult) => {
      if (r.type === "action") {
        switch (r.id) {
          case "action_run_full_suite":
          case "action_run_discovery":
          case "action_build_app":
          case "action_run_puppeteer":
          case "action_run_http":
            navigate("/start");
            break;
          case "action_compare_last_2": {
            const lastTwo = RUNS.slice(0, 2);
            const b = lastTwo[1]?.id ?? "";
            const c = lastTwo[0]?.id ?? "";
            navigate(`/compare?baseline=${b}&candidate=${c}`);
            break;
          }
          case "action_share_page":
            navigator.clipboard.writeText(window.location.href).catch(() => {});
            break;
          default:
            navigate(r.href);
            break;
        }
      } else {
        navigate(r.href);
      }
      onClose();
    },
    [navigate, onClose],
  );

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
      handleSelect(filtered[activeIdx]);
    }
  };

  const typeCounts = { test: 0, run: 0, compare: 0, suite: 0, action: 0 };
  ALL_RESULTS.forEach((r) => {
    if (r.type in typeCounts) typeCounts[r.type as keyof typeof typeCounts]++;
  });

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: "12vh",
          background: "var(--proof-overlay-dark)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          style={{
            position: "relative",
            width: "min(680px, 92vw)",
            background: "var(--proof-surface)",
            borderRadius: 16,
            boxShadow: "var(--proof-shadow-xl)",
            border: "1px solid var(--proof-border)",
            overflow: "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <CommandSearch
            query={query}
            typeFilter={typeFilter}
            typeCounts={typeCounts}
            inputRef={inputRef}
            onQueryChange={(value) => {
              setQuery(value);
              setActiveIdx(0);
            }}
            onTypeFilterChange={setTypeFilter}
            onKeyDown={handleKey}
          />
          <CommandResults
            filtered={filtered}
            query={query}
            activeIdx={safeActiveIdx}
            onSelect={handleSelect}
            onHover={setActiveIdx}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
