import React, { useEffect, useSyncExternalStore } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/aware/ErrorBoundary";
import { SkeletonTable, SkeletonChart, SkeletonCard } from "@/components/aware/Skeleton";
import { ConsoleShell } from "@/components/console";
import NotFound from "@/pages/NotFound";
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

const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const Runs = React.lazy(() => import("@/pages/Runs"));
const RunDetail = React.lazy(() => import("@/pages/RunDetail"));
const Compare = React.lazy(() => import("@/pages/Compare"));
const Tests = React.lazy(() => import("@/pages/Tests"));
const Trends = React.lazy(() => import("@/pages/TestAnalytics"));
const About = React.lazy(() => import("@/pages/About"));
const Copilot = React.lazy(() => import("@/pages/Copilot"));
const StartRun = React.lazy(() => import("@/pages/StartRun"));
const Sharing = React.lazy(() => import("@/pages/Sharing"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
            loadAllData().catch(() => {});
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
  return (
    <ConsoleShell>
      <Switch>
        <Route path="/">
          <ErrorBoundary><React.Suspense fallback={<SkeletonChart />}>
            <Dashboard />
          </React.Suspense></ErrorBoundary>
        </Route>
        <Route path="/runs">
          <ErrorBoundary><React.Suspense fallback={<SkeletonTable />}>
            <Runs />
          </React.Suspense></ErrorBoundary>
        </Route>
        <Route path="/runs/:runId">
          <ErrorBoundary><React.Suspense fallback={<SkeletonTable />}>
            <RunDetail />
          </React.Suspense></ErrorBoundary>
        </Route>
        <Route path="/compare">
          <ErrorBoundary><React.Suspense fallback={<SkeletonTable />}>
            <Compare />
          </React.Suspense></ErrorBoundary>
        </Route>
        <Route path="/trends">
          <ErrorBoundary><React.Suspense fallback={<SkeletonChart />}>
            <Trends />
          </React.Suspense></ErrorBoundary>
        </Route>
        <Route path="/tests">
          <ErrorBoundary><React.Suspense fallback={<SkeletonTable />}>
            <Tests />
          </React.Suspense></ErrorBoundary>
        </Route>
        <Route path="/suites">
          {() => {
            window.history.replaceState(null, "", `${import.meta.env.BASE_URL}tests`);
            return (
              <ErrorBoundary><React.Suspense fallback={<SkeletonTable />}>
                <Tests />
              </React.Suspense></ErrorBoundary>
            );
          }}
        </Route>
        <Route path="/copilot">
          <ErrorBoundary><React.Suspense fallback={<SkeletonCard />}>
            <Copilot />
          </React.Suspense></ErrorBoundary>
        </Route>
        <Route path="/about">
          <ErrorBoundary><React.Suspense fallback={<SkeletonCard />}>
            <About />
          </React.Suspense></ErrorBoundary>
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
              <ErrorBoundary><React.Suspense fallback={<SkeletonTable />}>
                <Runs />
              </React.Suspense></ErrorBoundary>
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
              <ErrorBoundary><React.Suspense fallback={<SkeletonTable />}>
                <Runs />
              </React.Suspense></ErrorBoundary>
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
              <ErrorBoundary><React.Suspense fallback={<SkeletonChart />}>
                <Trends />
              </React.Suspense></ErrorBoundary>
            );
          }}
        </Route>
        {/* Thin pages kept for deep-link compat but not in nav (progressive disclosure) */}
        <Route path="/start">
          <ErrorBoundary><React.Suspense fallback={<SkeletonCard />}>
            <StartRun />
          </React.Suspense></ErrorBoundary>
        </Route>
        <Route path="/share">
          <ErrorBoundary><React.Suspense fallback={<SkeletonCard />}>
            <Sharing />
          </React.Suspense></ErrorBoundary>
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
