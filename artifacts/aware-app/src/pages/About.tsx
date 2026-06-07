import React from "react";
import { AppLayout } from "@/components/aware/AppLayout";
import { Link } from "wouter";
import { Zap, BarChart3, GitCompare, Bug, Activity, Shield, Globe } from "lucide-react";

export default function About() {
  const features = [
    { icon: BarChart3, title: "Dashboard", desc: "Promotion readiness overview with per-environment pass rates, regression alerts, and version drift tracking." },
    { icon: Activity, title: "Run History", desc: "Full history of GitHub Actions test runs with filtering, side-panel detail, Slack sharing, and export." },
    { icon: GitCompare, title: "Regression Compare", desc: "Baseline vs candidate diff with per-test side panel, column filters, permalink sharing, and GitHub issue filing." },
    { icon: Bug, title: "Test Manager", desc: "CRUD for test cases with tabbed form (Basic Info, Docs, HTTP & Predicates), filmstrip visual comparison, bulk import/export, and AI generation." },
    { icon: Shield, title: "Security & DDoS", desc: "WAF validation, rate limiting, TLS negotiation, and DDoS mitigation test suites built into the test registry." },
    { icon: Globe, title: "CDN Coverage", desc: "Geo-match, locale-split, caching, routing, and edge-config test categories covering the full Akamai deployment surface." },
  ];

  const stack = [
    ["React 19 + Vite 7", "SPA with fast HMR"],
    ["Tailwind CSS 4 / GCP CSS vars", "Design tokens matching Google Cloud Console"],
    ["Recharts", "Pass-rate and analytics charts"],
    ["Wouter", "Lightweight SPA routing"],
    ["localStorage", "Client-side persistence for test registry"],
    ["Lucide React", "Icon system"],
  ];

  return (
    <AppLayout>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Hero */}
        <div className="gcp-card" style={{ padding: "32px 36px", marginBottom: 24, borderLeft: "4px solid var(--gcp-blue)", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
            <div style={{ width: 56, height: 56, background: "var(--gcp-blue)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Zap size={28} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--gcp-text)", marginBottom: 6, letterSpacing: "-0.5px" }}>A.W.A.K.E.</h1>
              <p style={{ fontSize: 14, color: "var(--gcp-text-secondary)", lineHeight: 1.6, maxWidth: 600 }}>
                <strong>Akamai Web Analyser &amp; Kit for Evaluations</strong> — a CDN regression test observability platform
                for GitHub Actions. Observe pass rates, compare baseline vs candidate, manage test cases, and
                gate promotions with confidence.
              </p>
              <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["GHA CDN Observability", "Akamai EdgeGrid", "Promotion Gating", "Regression Analysis"].map(tag => (
                  <span key={tag} style={{ fontSize: 11, padding: "3px 10px", background: "var(--gcp-blue-bg)", color: "var(--gcp-blue)", borderRadius: 12, fontWeight: 600, border: "1px solid var(--gcp-blue)" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Features grid */}
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: "var(--gcp-text)" }}>Platform Features</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, marginBottom: 28 }}>
          {features.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="gcp-card" style={{ padding: 20, display: "flex", gap: 14 }}>
                <div style={{ width: 36, height: 36, background: "var(--gcp-blue-bg)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={18} color="var(--gcp-blue)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: "var(--gcp-text)" }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: "var(--gcp-text-secondary)", lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tech stack */}
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: "var(--gcp-text)" }}>Tech Stack</h2>
        <div className="gcp-card" style={{ overflow: "hidden", marginBottom: 28 }}>
          <table className="gcp-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Technology</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {stack.map(([tech, role]) => (
                <tr key={tech}>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600 }}>{tech}</td>
                  <td style={{ color: "var(--gcp-text-secondary)", fontSize: 12 }}>{role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CTA */}
        <div className="gcp-card" style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Ready to explore?</div>
            <div style={{ fontSize: 12, color: "var(--gcp-text-secondary)" }}>Start with the Dashboard for a pass-rate summary, or dive into the Test Manager to manage your suite.</div>
          </div>
          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "var(--gcp-blue)", color: "white", borderRadius: 4, fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
              <BarChart3 size={14} /> Dashboard
            </Link>
            <Link href="/tests" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", border: "1px solid var(--gcp-blue)", color: "var(--gcp-blue)", borderRadius: 4, fontWeight: 600, fontSize: 13, textDecoration: "none", background: "var(--gcp-blue-bg)" }}>
              <Bug size={14} /> Test Manager
            </Link>
          </div>
        </div>

        <div style={{ marginTop: 20, fontSize: 11, color: "var(--gcp-text-secondary)", textAlign: "center" }}>
          A.W.A.K.E. — Akamai Web Analyser &amp; Kit for Evaluations · v2.0.0 · GHA CDN Observability Platform
        </div>
      </div>
    </AppLayout>
  );
}
