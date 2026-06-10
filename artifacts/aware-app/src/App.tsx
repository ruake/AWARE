import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/aware/ErrorBoundary";
import NotFound from "@/pages/not-found";

const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const Runs = React.lazy(() => import("@/pages/Runs"));
const RunDetail = React.lazy(() => import("@/pages/RunDetail"));
const Compare = React.lazy(() => import("@/pages/Compare"));
const TestManager = React.lazy(() => import("@/pages/TestManager"));
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

function Router() {
  return (
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
      <Route path="/tests">
        <React.Suspense fallback={<PageLoader />}>
          <TestManager />
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
      <Route path="/status">
        <React.Suspense fallback={<PageLoader />}>
          <Status />
        </React.Suspense>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary label="Application crashed">
      <QueryClientProvider client={queryClient}>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
