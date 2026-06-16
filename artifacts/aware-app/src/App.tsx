import React, { useEffect, useMemo, useSyncExternalStore } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/aware/ErrorBoundary";
import { ConsoleShell } from "@/components/console";
import NotFound from "@/pages/not-found";
import { loadAllData, getDataInitState, subscribeToDataInit } from "@/lib/data";
import { AlertTriangle, RefreshCw, Loader2 } from "lucide-react";

/*
 * ── Navigation Architecture ─────────────────────────────────────────────
 *
 * Based on:
 *   Shneiderman (1996) "The Eyes Have It" — Visual Information-Seeking Mantra:
 *     Overview first, zoom and filter, then details-on-demand.
 *     Plus "relate" (cross-link entities) and "history" (show trends).
 *
 *   Pirolli & Card (1999) "Information Foraging Theory" — Information Scent:
 *     Navigation labels must signal what the user will find. Avoid brand names
 *     ("Pulse") in favor of task-descriptive labels ("Activity").
 *
 *   Stephen Few (2006) "Information Dashboard Design" — Monitor pages should
 *     communicate signal (what needs attention NOW), not noise. Tables and
 *     deep-dive charts belong on Investigate pages, not the Dashboard.
 *
 *   Nielsen (1994) 10 Usability Heuristics — especially:
 *     #4 Consistency: route === page title, terminology doesn't vary
 *     #6 Recognition > Recall: cross-link entities so users don't re-navigate
 *     #8 Aesthetic & Minimalist: remove thin/overlapping pages
 *
 *   Lidwell "Universal Principles of Design" — Progressive Disclosure:
 *     Nav has 4 groups (down from 6). Thin pages (StartRun, Search) become
 *     contextual modals triggered from primary pages, not standalone routes.
 *
 * ── Navigation Groups ────────────────────────────────────────────────────
 *
 *   MONITOR    (Overview — Shneiderman's "overview first")
 *     Dashboard   /     Signal: KPIs, anomalies, sparklines. No tables.
 *     Activity    /activity  Chronological feed of all events.
 *
 *   INVESTIGATE (Zoom/Filter → Detail — Shneiderman's "zoom, filter, details")
 *     Runs        /runs       Filterable list → RunDetail at /runs/:id
 *     Compare     /compare    Side-by-side baseline vs candidate diff
 *     Trends      /trends     Charts, flakiness, heatmaps (was "Analytics")
 *
 *   CONFIGURE   (System setup — progressive disclosure)
 *     Test Suites /suites     Suite hierarchy + YAML
 *
 *   ASSIST      (Cross-cutting tools)
 *     Copilot     /copilot    AI assistant
 *     About       /about      Project info + sharing
 */

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number | string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const SIDEBAR_NAV: NavGroup[] = [
  {
    title: "Monitor",
    items: [
      { label: "Dashboard", href: "/", icon: "LayoutDashboard" },
      { label: "Activity", href: "/runs", icon: "Activity" },
    ],
  },
  {
    title: "Investigate",
    items: [
      { label: "Runs", href: "/runs", icon: "History" },
      { label: "Compare", href: "/compare", icon: "GitCompare" },
      { label: "Trends", href: "/trends", icon: "BarChart3" },
    ],
  },
  {
    title: "Configure",
    items: [{ label: "Test Suites", href: "/suites", icon: "FolderTree" }],
  },
  {
    title: "Assist",
    items: [
      { label: "Copilot", href: "/copilot", icon: "Bot" },
      { label: "About", href: "/about", icon: "Info" },
    ],
  },
];

// Strong information scent: labels describe content, not brand names
const BREADCRUMB_MAP: Record<string, { label: string; parent?: { label: string; href: string } }> =
  {
    "/": { label: "Dashboard" },
    "/runs": { label: "Activity & Runs", parent: { label: "Monitor", href: "/" } },
    "/runs/:runId": { label: "Run Detail", parent: { label: "Runs", href: "/runs" } },
    "/compare": { label: "Compare", parent: { label: "Investigate", href: "/" } },
    "/trends": { label: "Trends", parent: { label: "Investigate", href: "/" } },
    "/suites": { label: "Test Suites", parent: { label: "Configure", href: "/" } },
    "/copilot": { label: "Copilot", parent: { label: "Assist", href: "/" } },
    "/about": { label: "About", parent: { label: "Assist", href: "/" } },
    "/testdoc": { label: "Test Documentation" },
    "/start": { label: "Start Run" },
    "/share": { label: "Sharing" },
  };

const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const Runs = React.lazy(() => import("@/pages/Runs"));
const RunDetail = React.lazy(() => import("@/pages/RunDetail"));
const Compare = React.lazy(() => import("@/pages/Compare"));
const TestSuites = React.lazy(() => import("@/pages/TestSuiteManager"));
const Trends = React.lazy(() => import("@/pages/TestAnalytics"));
const About = React.lazy(() => import("@/pages/About"));
const Copilot = React.lazy(() => import("@/pages/Copilot"));
const TestDoc = React.lazy(() => import("@/pages/TestDoc"));
const StartRun = React.lazy(() => import("@/pages/StartRun"));
const Sharing = React.lazy(() => import("@/pages/Sharing"));

const queryClient = new QueryClient();

function PageLoader({ text }: { text?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--proof-grey-bg)",
      }}
    >
      <div
        style={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div className="proof-skeleton" style={{ width: 48, height: 48, borderRadius: "50%" }} />
        <div className="proof-skeleton" style={{ width: 200, height: 16, borderRadius: 4 }} />
        {text && <div style={{ fontSize: 13, color: "var(--proof-text-secondary)" }}>{text}</div>}
      </div>
    </div>
  );
}

function DataGate({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribeToDataInit, getDataInitState);
  const triggeredRef = React.useRef(false);

  useEffect(() => {
    if (!triggeredRef.current && !state.loaded && !state.loading) {
      triggeredRef.current = true;
      loadAllData().catch(() => {});
    }
  }, [state.loaded, state.loading]);

  if (state.error && !state.loading && !state.loaded) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "var(--proof-grey-bg)",
          flexDirection: "column",
          gap: 16,
          padding: 40,
        }}
      >
        <AlertTriangle size={32} style={{ color: "var(--proof-red)" }} />
        <span style={{ fontSize: 18, fontWeight: 600, color: "var(--proof-text)" }}>
          Failed to load application data
        </span>
        <pre
          style={{
            fontSize: 13,
            color: "var(--proof-text-secondary)",
            maxWidth: 500,
            textAlign: "center",
            margin: 0,
            fontFamily: "var(--font-mono)",
          }}
        >
          {String(state.error)}
        </pre>
        <button
          onClick={() => {
            triggeredRef.current = false;
          }}
          style={{
            padding: "8px 18px",
            fontSize: 13,
            fontWeight: 600,
            background: "var(--proof-blue)",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {!state.loaded && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 16px",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--proof-blue)",
            background: "var(--proof-blue-bg)",
            borderBottom: "1px solid var(--proof-blue)",
            pointerEvents: "none",
          }}
        >
          <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
          <span>
            Loading data: runs, results, suites, promotions, scheduler status, test discovery...
          </span>
        </div>
      )}
      {children}
    </>
  );
}

function Router() {
  const [location] = useLocation();

  const breadcrumbs = useMemo(() => {
    const direct = BREADCRUMB_MAP[location];
    if (direct) {
      const items: { label: string; href?: string }[] = [];
      if (direct.parent) {
        items.push({ label: direct.parent.label, href: direct.parent.href });
      }
      items.push({ label: direct.label });
      return items;
    }
    // Dynamic route: /runs/:runId
    if (/^\/runs\//.test(location)) {
      const segments = location.split("/");
      const key = `/runs/:runId`;
      const entry = BREADCRUMB_MAP[key];
      if (entry && segments.length === 3) {
        const items: { label: string; href?: string }[] = [];
        if (entry.parent) {
          items.push({ label: entry.parent.label, href: entry.parent.href });
        }
        items.push({ label: entry.label });
        return items;
      }
    }
    return [];
  }, [location]);

  return (
    <ConsoleShell sidebarNav={SIDEBAR_NAV} breadcrumbs={breadcrumbs} activePath={location}>
      <Switch>
        <Route path="/">
          <React.Suspense fallback={<PageLoader />}>
            <Dashboard />
          </React.Suspense>
        </Route>
        <Route path="/runs">
          <React.Suspense fallback={<PageLoader />}>
            <Runs />
          </React.Suspense>
        </Route>
        <Route path="/runs/:runId">
          <React.Suspense fallback={<PageLoader />}>
            <RunDetail />
          </React.Suspense>
        </Route>
        <Route path="/compare">
          <React.Suspense fallback={<PageLoader />}>
            <Compare />
          </React.Suspense>
        </Route>
        <Route path="/trends">
          <React.Suspense fallback={<PageLoader />}>
            <Trends />
          </React.Suspense>
        </Route>
        <Route path="/suites">
          <React.Suspense fallback={<PageLoader />}>
            <TestSuites />
          </React.Suspense>
        </Route>
        <Route path="/copilot">
          <React.Suspense fallback={<PageLoader />}>
            <Copilot />
          </React.Suspense>
        </Route>
        <Route path="/testdoc">
          <React.Suspense fallback={<PageLoader />}>
            <TestDoc />
          </React.Suspense>
        </Route>
        <Route path="/about">
          <React.Suspense fallback={<PageLoader />}>
            <About />
          </React.Suspense>
        </Route>
        {/* Redirects from old route names (Nielsen #4: don't break bookmarks) */}
        <Route path="/activity">
          {() => {
            window.history.replaceState(
              null,
              "",
              window.location.pathname.replace("/activity", "/runs"),
            );
            return (
              <React.Suspense fallback={<PageLoader />}>
                <Runs />
              </React.Suspense>
            );
          }}
        </Route>
        <Route path="/pulse">
          {() => {
            window.history.replaceState(
              null,
              "",
              window.location.pathname.replace("/pulse", "/runs"),
            );
            return (
              <React.Suspense fallback={<PageLoader />}>
                <Runs />
              </React.Suspense>
            );
          }}
        </Route>
        <Route path="/analytics">
          {() => {
            window.history.replaceState(
              null,
              "",
              window.location.pathname.replace("/analytics", "/trends"),
            );
            return (
              <React.Suspense fallback={<PageLoader />}>
                <Trends />
              </React.Suspense>
            );
          }}
        </Route>
        {/* Thin pages kept for deep-link compat but not in nav (progressive disclosure) */}
        <Route path="/start">
          <React.Suspense fallback={<PageLoader />}>
            <StartRun />
          </React.Suspense>
        </Route>
        <Route path="/share">
          <React.Suspense fallback={<PageLoader />}>
            <Sharing />
          </React.Suspense>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </ConsoleShell>
  );
}

function App() {
  return (
    <ErrorBoundary label="Application crashed">
      <QueryClientProvider client={queryClient}>
        <DataGate>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </DataGate>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
