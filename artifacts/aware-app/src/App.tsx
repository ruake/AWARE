import React, { useEffect, useSyncExternalStore } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
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
 *
 *   INVESTIGATE (Zoom/Filter → Detail — Shneiderman's "zoom, filter, details")
 *     Runs        /runs       Filterable list → RunDetail at /runs/:id
 *     Compare     /compare    Side-by-side baseline vs candidate diff
 *     Trends      /trends     Charts, flakiness, heatmaps (was "Analytics")
 *     Tests       /tests      Test case library
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
const Settings = React.lazy(() => import("@/pages/Settings"));
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

// ── Route names for accessibility announcements (U-06) ───────────────
const ROUTE_NAMES: Record<string, string> = {
  "/": "Dashboard",
  "/runs": "Runs",
  "/compare": "Compare",
  "/trends": "Trends",
  "/tests": "Tests",
  "/copilot": "Copilot",
  "/settings": "Settings",
  "/about": "About",
  "/start": "Start Run",
  "/share": "Share",
};

function RouteAnnouncer() {
  const [location] = useLocation();
  const [announcement, setAnnouncement] = React.useState("");

  useEffect(() => {
    const base = "/" + location.replace(/^\//, "").split(/[/?]/)[0];
    const routeKey = base === "/" ? "/" : base;
    const name = ROUTE_NAMES[routeKey] ?? "Page";
    const t0 = setTimeout(() => setAnnouncement(`Navigated to ${name}`), 0);
    const t1 = setTimeout(() => setAnnouncement(""), 2500);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
    };
  }, [location]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0,0,0,0)",
        whiteSpace: "nowrap",
        border: 0,
        zIndex: -1,
      }}
    >
      {announcement}
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

  if (!state.runsReady && !state.loaded) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          flexDirection: "column",
          gap: 24,
          background: "var(--proof-bg)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Animated background glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            height: 400,
            background: "radial-gradient(circle, var(--proof-blue-glow) 0%, transparent 70%)",
            opacity: 0.15,
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(135deg, var(--proof-blue) 0%, var(--proof-blue-bright) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 32px var(--proof-blue-glow)",
              animation: "pulse-dot 2s ease-in-out infinite",
            }}
          >
            <Loader2
              size={32}
              style={{ color: "white", animation: "spin 1.5s linear infinite" }}
            />
          </div>
        </div>

        <div style={{ textAlign: "center", zIndex: 1 }}>
          <h2
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: "var(--proof-text)",
              margin: "0 0 4px",
              letterSpacing: "-0.5px",
            }}
          >
            AWARE
          </h2>
          <span style={{ fontSize: 13, color: "var(--proof-text-secondary)", fontWeight: 500 }}>
            Initializing command center…
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

const SEB = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>
    <React.Suspense fallback={<SkeletonTable />}>{children}</React.Suspense>
  </ErrorBoundary>
);

function Router() {
  return (
    <>
      <RouteAnnouncer />
      <ConsoleShell>
        {/* display:contents means this div is invisible to layout but anchors #main-content */}
        <div id="main-content" style={{ display: "contents" }}>
          <Switch>
            <Route path="/">
              <ErrorBoundary>
                <React.Suspense fallback={<SkeletonChart />}>
                  <Dashboard />
                </React.Suspense>
              </ErrorBoundary>
            </Route>
            <Route path="/runs">
              <SEB>
                <Runs />
              </SEB>
            </Route>
            <Route path="/runs/:runId">
              <SEB>
                <RunDetail />
              </SEB>
            </Route>
            <Route path="/compare">
              <SEB>
                <Compare />
              </SEB>
            </Route>
            <Route path="/trends">
              <ErrorBoundary>
                <React.Suspense fallback={<SkeletonChart />}>
                  <Trends />
                </React.Suspense>
              </ErrorBoundary>
            </Route>
            <Route path="/tests">
              <SEB>
                <Tests />
              </SEB>
            </Route>
            {/* Redirect /tests/:testId → /tests?detail=id (no history stack pollution) */}
            <Route path="/tests/:testId">
              {({ testId }: { testId: string }) => <Redirect to={`/tests?detail=${testId}`} />}
            </Route>
            {/* Redirect /suites → /tests */}
            <Route path="/suites">
              <Redirect to="/tests" />
            </Route>
            <Route path="/copilot">
              <ErrorBoundary>
                <React.Suspense fallback={<SkeletonCard />}>
                  <Copilot />
                </React.Suspense>
              </ErrorBoundary>
            </Route>
            <Route path="/settings">
              <SEB>
                <Settings />
              </SEB>
            </Route>
            <Route path="/about">
              <ErrorBoundary>
                <React.Suspense fallback={<SkeletonCard />}>
                  <About />
                </React.Suspense>
              </ErrorBoundary>
            </Route>
            {/* Permanent redirects from old route names — preserve deep-links (Nielsen #4) */}
            <Route path="/activity">
              <Redirect to="/runs" />
            </Route>
            <Route path="/pulse">
              <Redirect to="/runs" />
            </Route>
            <Route path="/analytics">
              <Redirect to="/trends" />
            </Route>
            {/* Thin utility pages — not in main nav (progressive disclosure) */}
            <Route path="/start">
              <ErrorBoundary>
                <React.Suspense fallback={<SkeletonCard />}>
                  <StartRun />
                </React.Suspense>
              </ErrorBoundary>
            </Route>
            <Route path="/share">
              <ErrorBoundary>
                <React.Suspense fallback={<SkeletonCard />}>
                  <Sharing />
                </React.Suspense>
              </ErrorBoundary>
            </Route>
            <Route component={NotFound} />
          </Switch>
        </div>
      </ConsoleShell>
    </>
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
