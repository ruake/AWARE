import React from 'react';
import { Switch, Route, Router as WouterRouter, useLocation } from 'wouter';
import { AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const Runs = React.lazy(() => import('@/pages/Runs'));
const RunDetail = React.lazy(() => import('@/pages/RunDetail'));
const Compare = React.lazy(() => import('@/pages/Compare'));

function NotFound() {
  return <div className="p-8 text-gcp-text-secondary">404 — Page not found</div>;
}

function AppRoutes() {
  const [loc] = useLocation();
  const basePath = '/' + (loc.split('/')[1] || '');

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
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <AppRoutes />
    </WouterRouter>
  );
}
