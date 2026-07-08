import React from 'react';
import { Switch, Route, Router as WouterRouter } from 'wouter';
import { Layout } from '@/components/Layout';

const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const Runs = React.lazy(() => import('@/pages/Runs'));
const RunDetail = React.lazy(() => import('@/pages/RunDetail'));
const Compare = React.lazy(() => import('@/pages/Compare'));

function NotFound() {
  return <div className="p-8 text-gcp-text-secondary">404 — Page not found</div>;
}

function LoadingSpinner() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '16rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <div
          style={{
            width: '1.5rem',
            height: '1.5rem',
            border: '2px solid rgba(148, 163, 184, 0.3)',
            borderTopColor: 'var(--proof-blue, #3b82f6)',
            borderRadius: '9999px',
            animation: 'spin 0.6s linear infinite',
          }}
        />
        <span style={{ fontSize: '0.875rem', color: 'var(--proof-text-muted, #94a3b8)' }}>
          Loading…
        </span>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Layout>
      <React.Suspense fallback={<LoadingSpinner />}>
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
