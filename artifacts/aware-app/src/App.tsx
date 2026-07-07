import React from 'react';
import { Switch, Route, Router as WouterRouter } from 'wouter';
import { Layout } from '@/components/Layout';

const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const Runs = React.lazy(() => import('@/pages/Runs'));
const RunDetail = React.lazy(() => import('@/pages/RunDetail'));
const Compare = React.lazy(() => import('@/pages/Compare'));

function NotFound() {
  return <div className="p-8 text-zinc-400">404 — Page not found</div>;
}

function AppRoutes() {
  return (
    <Layout>
      <React.Suspense fallback={<div className="p-8 text-zinc-400">Loading…</div>}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/runs" component={Runs} />
          <Route path="/runs/:runId" component={RunDetail} />
          <Route path="/compare" component={Compare} />
          <Route component={NotFound} />
        </Switch>
      </React.Suspense>
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
