import React, { useEffect, useState, useMemo } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/aware/ErrorBoundary";
import { ConsoleShell } from "@/components/console";
import NotFound from "@/pages/not-found";
import { loadAllData } from "@/lib/data";

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
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: "LayoutDashboard" },
      { label: "Pulse", href: "/pulse", icon: "Activity" },
    ],
  },
  {
    title: "Testing",
    items: [
      { label: "Runs", href: "/runs", icon: "History" },
      { label: "Compare", href: "/compare", icon: "GitCompare" },
      { label: "Start Run", href: "/start", icon: "PlayCircle" },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Test Analytics", href: "/analytics", icon: "BarChart3" },
      { label: "Suites", href: "/suites", icon: "FolderTree" },
    ],
  },
  {
    title: "CI/CD",
    items: [
      { label: "CI Pipeline", href: "/ci-pipeline", icon: "Container" },
      { label: "Status", href: "/status", icon: "CheckCircle2" },
    ],
  },
  {
    title: "Tools",
    items: [
      { label: "Copilot", href: "/copilot", icon: "Bot" },
      { label: "Test Doc", href: "/testdoc", icon: "FileText" },
      { label: "Search", href: "/search", icon: "Search" },
      { label: "Sharing", href: "/share", icon: "Share2" },
    ],
  },
  {
    title: "Info",
    items: [
      { label: "About", href: "/about", icon: "Info" },
    ],
  },
];

const BREADCRUMB_MAP: Record<string, { label: string; parent?: { label: string; href: string } }> = {
  "/": { label: "Dashboard" },
  "/pulse": { label: "Pulse", parent: { label: "Overview", href: "/" } },
  "/runs": { label: "Runs", parent: { label: "Testing", href: "/" } },
  "/runs/:runId": { label: "Run Detail", parent: { label: "Runs", href: "/runs" } },
  "/compare": { label: "Compare", parent: { label: "Testing", href: "/" } },
  "/start": { label: "Start Run", parent: { label: "Testing", href: "/" } },
  "/analytics": { label: "Test Analytics", parent: { label: "Analytics", href: "/" } },
  "/suites": { label: "Suites", parent: { label: "Analytics", href: "/" } },
  "/ci-pipeline": { label: "CI Pipeline", parent: { label: "CI/CD", href: "/" } },
  "/status": { label: "Status", parent: { label: "CI/CD", href: "/" } },
  "/copilot": { label: "Copilot", parent: { label: "Tools", href: "/" } },
  "/testdoc": { label: "Test Doc", parent: { label: "Tools", href: "/" } },
  "/search": { label: "Search", parent: { label: "Tools", href: "/" } },
  "/share": { label: "Sharing", parent: { label: "Tools", href: "/" } },
  "/about": { label: "About", parent: { label: "Info", href: "/" } },
  "/home": { label: "Home" },
};

const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const Runs = React.lazy(() => import("@/pages/Runs"));
const RunDetail = React.lazy(() => import("@/pages/RunDetail"));
const Compare = React.lazy(() => import("@/pages/Compare"));
const TestSuiteManager = React.lazy(() => import("@/pages/TestSuiteManager"));
const TestAnalytics = React.lazy(() => import("@/pages/TestAnalytics"));
const TestDoc = React.lazy(() => import("@/pages/TestDoc"));
const SearchDemo = React.lazy(() => import("@/pages/SearchDemo"));
const StartRun = React.lazy(() => import("@/pages/StartRun"));
const Sharing = React.lazy(() => import("@/pages/Sharing"));
const Status = React.lazy(() => import("@/pages/Status"));
const About = React.lazy(() => import("@/pages/About"));
const Copilot = React.lazy(() => import("@/pages/Copilot"));
const Pulse = React.lazy(() => import("@/pages/Pulse"));
const Home = React.lazy(() => import("@/pages/Home"));

const queryClient = new QueryClient();

function PageLoader() {
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
        <div className="proof-skeleton" style={{ width: 140, height: 12, borderRadius: 4 }} />
      </div>
    </div>
  );
}

function DataGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    loadAllData()
      .then(() => setReady(true))
      .catch(setError);
  }, []);

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "var(--proof-grey-bg)",
          color: "var(--proof-red, #ef4444)",
          fontSize: 18,
          flexDirection: "column",
          gap: 12,
        }}
      >
        <span>Failed to load application data</span>
        <pre style={{ fontSize: 13, color: "var(--proof-muted, #6b7280)" }}>{String(error)}</pre>
      </div>
    );
  }

  if (!ready) return <PageLoader />;

  return <>{children}</>;
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
    if (/^\/runs\//.test(location) && location.split("/").length === 3) {
      const run = BREADCRUMB_MAP["/runs/:runId"];
      if (run) {
        const items: { label: string; href?: string }[] = [];
        if (run.parent) {
          items.push({ label: run.parent.label, href: run.parent.href });
        }
        items.push({ label: run.label });
        return items;
      }
    }
    return [];
  }, [location]);

  return (
    <ConsoleShell sidebarNav={SIDEBAR_NAV} breadcrumbs={breadcrumbs} activePath={location}>
      <Switch>
        <Route path="/home">
          <React.Suspense fallback={<PageLoader />}>
            <Home />
          </React.Suspense>
        </Route>
        <Route path="/">
          <React.Suspense fallback={<PageLoader />}>
            <Dashboard />
          </React.Suspense>
        </Route>
        <Route path="/start">
          <React.Suspense fallback={<PageLoader />}>
            <StartRun />
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
        <Route path="/analytics">
          <React.Suspense fallback={<PageLoader />}>
            <TestAnalytics />
          </React.Suspense>
        </Route>
        <Route path="/suites">
          <React.Suspense fallback={<PageLoader />}>
            <TestSuiteManager />
          </React.Suspense>
        </Route>
        <Route path="/copilot">
          <React.Suspense fallback={<PageLoader />}>
            <Copilot />
          </React.Suspense>
        </Route>
        <Route path="/pulse">
          <React.Suspense fallback={<PageLoader />}>
            <Pulse />
          </React.Suspense>
        </Route>
        <Route path="/ci-pipeline">
          <React.Suspense fallback={<PageLoader />}>
            <Status />
          </React.Suspense>
        </Route>
        <Route path="/about">
          <React.Suspense fallback={<PageLoader />}>
            <About />
          </React.Suspense>
        </Route>
        <Route path="/testdoc">
          <React.Suspense fallback={<PageLoader />}>
            <TestDoc />
          </React.Suspense>
        </Route>
        <Route path="/search">
          <React.Suspense fallback={<PageLoader />}>
            <SearchDemo />
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
