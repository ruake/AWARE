import React from "react";
import { Link, Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ArrowLeft, SearchX } from "lucide-react";

const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const Runs = React.lazy(() => import("@/pages/Runs"));
const RunDetail = React.lazy(() => import("@/pages/RunDetail"));
const Compare = React.lazy(() => import("@/pages/Compare"));
const TestAnalytics = React.lazy(() => import("@/pages/TestAnalytics"));

function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col items-center justify-center h-[70vh] gap-5 px-8"
    >
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gcp-blue-bg border border-gcp-blue-border shadow-[0_0_20px_rgba(66,133,244,0.15)]">
        <SearchX size={24} className="text-gcp-blue" />
      </div>
      <div className="text-center">
        <h2 className="text-base font-semibold text-gcp-text mb-1">Page not found</h2>
        <p className="text-sm text-gcp-text-secondary max-w-xs">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gcp-blue hover:text-gcp-blue-light transition-colors"
      >
        <ArrowLeft size={13} />
        Back to Dashboard
      </Link>
    </motion.div>
  );
}

function AppRoutes() {
  const [loc] = useLocation();
  const basePath = "/" + (loc.split("/")[1] || "");

  return (
    <Layout>
      <ErrorBoundary>
        <React.Suspense fallback={<LoadingSpinner />}>
          <AnimatePresence mode="wait" key={basePath}>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/runs" component={Runs} />
              <Route path="/runs/:runId" component={RunDetail} />
              <Route path="/compare" component={Compare} />
              <Route path="/analytics" component={TestAnalytics} />
              <Route component={NotFound} />
            </Switch>
          </AnimatePresence>
        </React.Suspense>
      </ErrorBoundary>
    </Layout>
  );
}

export default function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <AppRoutes />
    </WouterRouter>
  );
}
