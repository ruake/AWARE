import React from "react";
import { AppLayout } from "@/components/aware/AppLayout";
import { useLocation } from "wouter";
import {
  Zap, BarChart3, GitCompare, Bug, Activity, Shield, Globe, Book,
  ActivityIcon, TestTube, Layers, TrendingUp, PieChart, Server,
  Cpu, Box, Cloud, Lock, Route, } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RUNS, ENV_SUMMARY, computeRunFrequency } from "@/lib/data";
import { getAutoDiscoveredTests, getAutoDiscoverySummary } from "@/lib/data";
import { getTestSuites } from "@/lib/data";
import { getAllPromotionDecisions } from "@/lib/data";

/* ────── shared helpers ────── */
function useCountUp(target: number): string {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    let n = 0; const step = Math.max(1, Math.floor(target / 35));
    const t = setInterval(() => { n += step; if (n >= target) { n = target; clearInterval(t); } setV(n); }, 20);
    return () => clearInterval(t);
  }, [target]);
  return v.toLocaleString();
}

const DECO_DOT = (color: string, size = 4, delay = "0s") => ({
  width: size, height: size, borderRadius: "50%", background: color,
  position: "absolute" as const, pointerEvents: "none" as const,
  opacity: 0.25, animation: `float 3s ease-in-out infinite`,
  animationDelay: delay,
});

const FEATURES = [
  { icon: BarChart3, title: "Dashboard", desc: "Real-time pass rate trends with anomaly detection", color: "#2563eb" },
  { icon: GitCompare, title: "Regression Compare", desc: "Baseline vs candidate diff with column filters", color: "#10b981" },
  { icon: Activity, title: "Run History", desc: "Filterable run table with detail panels", color: "#f59e0b" },
  { icon: Shield, title: "Promotion Gating", desc: "Gate deployments with pass-rate thresholds", color: "#f97316" },
  { icon: TestTube, title: "Test Manager", desc: "Full CRUD, bulk import/export, AI generation", color: "#8b5cf6" },
  { icon: Layers, title: "Test Suites", desc: "Hierarchical tree with YAML export", color: "#ef4444" },
  { icon: Globe, title: "Cross-Env Testing", desc: "3 tiers × 2 networks, property version shown", color: "#06b6d4" },
  { icon: Zap, title: "AI Copilot", desc: "OpenAI, WebLLM, Chrome AI with 5 skills", color: "#f59e0b" },
] as const;

/* ────── MAIN ────── */
export default function About() {
  const [, navigate] = useLocation();
  const suites = getTestSuites();
  const tests = getAutoDiscoveredTests();
  const summary = getAutoDiscoverySummary();
  const promos = getAllPromotionDecisions();
  const freq = computeRunFrequency();
  const suiteCount = suites.length;
  const testCount = tests.length;
  const passRate = RUNS.length > 0 ? Math.round(RUNS.reduce((s, r) => s + r.passPct, 0) / RUNS.length) : 0;
  const promoteCount = promos.filter((p) => p.decision === "promote").length;
  const promoPct = promos.length > 0 ? Math.round((promoteCount / promos.length) * 100) : 0;

  /* animated counters */
  const cRuns = useCountUp(RUNS.length);
  const cTests = useCountUp(testCount);
  const cSuites = useCountUp(suiteCount);
  const cRate = useCountUp(passRate);

  return (
    <AppLayout>
      <div className="proof-page" style={{ overflow: "hidden" }}>
        {/* ════════════════ HERO — full bleed splash ════════════════ */}
        <section
          style={{
            position: "relative", overflow: "hidden",
            background: "var(--proof-hero-about)",
            borderBottom: "1px solid rgba(37,99,235,0.15)",
            padding: "56px 32px 40px",
          }}
        >
          {/* floating orbs */}
          <div style={{ ...DECO_DOT("#2563eb", 120, "0s"), top: "10%", right: "15%", opacity: 0.06, animation: "float 5s ease-in-out infinite" }} />
          <div style={{ ...DECO_DOT("#8b5cf6", 80, "1.5s"), bottom: "20%", right: "30%", opacity: 0.05, animation: "float 4s ease-in-out infinite 1.5s" }} />
          <div style={{ ...DECO_DOT("#10b981", 60, "0.8s"), top: "30%", left: "10%", opacity: 0.04, animation: "float 6s ease-in-out infinite 0.8s" }} />

          <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative" }}>
            {/* icon + title row */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div
                style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: "linear-gradient(135deg, #2563eb, #8b5cf6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 30px rgba(37,99,235,0.3)",
                  animation: "pulse-ring 2s ease-in-out infinite",
                }}
              >
                <Zap size={24} color="white" />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--proof-text)", letterSpacing: "-1.2px", lineHeight: 1, margin: 0, animation: "slide-up 0.4s ease-out" }}>
                    A.W.A.R.E.
                  </h1>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "var(--proof-text-muted)", fontFamily: "var(--font-mono)" }}>v2.0.0</span>
                </div>
                <p style={{ fontSize: 12, color: "var(--proof-text-secondary)", margin: "4px 0 0", maxWidth: 500, lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--proof-text)" }}>Akamai Web Analytics Regression Engine</strong> — CDN test observability. No backend. No setup. No sign-up.
                </p>
              </div>
            </div>

            {/* stat ticker — not cards, a connected row */}
            <div
              style={{
                display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0,
                borderRadius: 10, overflow: "hidden",
                border: "1px solid rgba(37,99,235,0.15)",
              }}
            >
              {[
                { val: cRuns, label: "Runs", color: "#2563eb", icon: ActivityIcon },
                { val: cTests, label: "Tests", color: "#10b981", icon: TestTube },
                { val: cSuites, label: "Suites", color: "#8b5cf6", icon: Layers },
                { val: `${cRate}%`, label: "Pass Rate", color: "#f59e0b", icon: TrendingUp },
              ].map((s, i) => (
                <div
                  key={s.label}
                  style={{
                    padding: "14px 8px", textAlign: "center",
                    background: i % 2 === 0 ? "var(--proof-subtle-bg)" : "var(--proof-subtle-bg2)",
                    borderRight: i < 3 ? "1px solid rgba(37,99,235,0.1)" : "none",
                    animation: `slide-up 0.3s ease-out ${i * 0.08}s both`,
                  }}
                >
                  <div style={{ fontSize: 26, fontWeight: 900, color: s.color, fontFamily: "var(--font-mono)", letterSpacing: "-0.8px", lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: "var(--proof-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* tags */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 }}>
              {["GHA Observability", "Regression Testing", "Promotion Gating", "Cross-Environment", "AI-Powered"].map((t, i) => (
                <span key={t} style={{
                  fontSize: 9, padding: "2px 10px", borderRadius: 999,
                  background: `rgba(37,99,235,${0.05 + i * 0.03})`,
                  color: "var(--proof-blue)", fontWeight: 600,
                  border: "1px solid rgba(37,99,235,0.15)",
                  animation: `fade-in 0.3s ease-out ${0.3 + i * 0.06}s both`,
                }}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          {/* ════════════════ WHAT IS — visual story (no cards) ════════════════ */}
          <section style={{ padding: "36px 0 28px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(37,99,235,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Book size={13} style={{ color: "#2563eb" }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "var(--proof-text)", letterSpacing: "-0.3px" }}>What is A.W.A.R.E.?</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", lineHeight: 1.8, margin: 0 }}>
                  A browser-based dashboard that tracks Akamai CDN test health after every code change.
                  Pass rates, regressions, and promotion readiness — across QA, UAT, and PROD — entirely in your browser.
                </p>
                <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
                  {["No backend", "No setup", "No sign-up", "Open source"].map((tag) => (
                    <span key={tag} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: "rgba(16,185,129,0.08)", color: "var(--proof-green)", fontWeight: 600, border: "1px solid rgba(16,185,129,0.15)" }}>{tag}</span>
                  ))}
                </div>
              </div>

              {/* Step flow — visual connector */}
              <div style={{ position: "relative" }}>
                {/* vertical connecting line */}
                <div style={{ position: "absolute", left: 14, top: 8, bottom: 8, width: 2, background: "linear-gradient(180deg, #2563eb, #10b981, #8b5cf6, #f59e0b)", borderRadius: 1 }} />
                {[
                  { step: "01", title: "Code Change", desc: "Push triggers automated test runs", color: "#2563eb" },
                  { step: "02", title: "Results Ingest", desc: "Outcomes pushed in real-time", color: "#10b981" },
                  { step: "03", title: "Analysis", desc: "Rates, regressions, trends computed", color: "#8b5cf6" },
                  { step: "04", title: "Decision", desc: "Promote or block with confidence", color: "#f59e0b" },
                ].map((s, i) => (
                  <div key={s.step} style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: i < 3 ? 14 : 0, animation: `slide-up 0.3s ease-out ${0.15 + i * 0.1}s both` }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${s.color}18`, border: `2px solid ${s.color}50`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative", zIndex: 1, boxShadow: `0 0 12px ${s.color}15` }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: s.color, fontFamily: "var(--font-mono)" }}>{s.step}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--proof-text)" }}>{s.title}</div>
                      <div style={{ fontSize: 11, color: "var(--proof-text-muted)" }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ════════════════ BY THE NUMBERS — dashboard style ════════════════ */}
          <section style={{ padding: "24px 0 28px" }}>
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Live Metrics</span>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--proof-text)", letterSpacing: "-0.5px", marginTop: 2 }}>By the Numbers</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[
                { icon: ActivityIcon, value: String(RUNS.length), label: "Total Runs", sub: `${freq.avgIntervalHours}h avg interval`, color: "#2563eb", gradient: "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(37,99,235,0.04))" },
                { icon: TestTube, value: String(testCount), label: "Discovered Tests", sub: `${summary.sourceFiles} source files`, color: "#10b981", gradient: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))" },
                { icon: Layers, value: String(suiteCount), label: "Test Suites", sub: `${Object.keys(summary.byCategory).length} categories`, color: "#8b5cf6", gradient: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(139,92,246,0.04))" },
                { icon: TrendingUp, value: `${passRate}%`, label: "Overall Pass Rate", sub: `${promoteCount} promotions · ${promoPct}% rate`, color: "#f59e0b", gradient: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))" },
              ].map((s) => {
                const I = s.icon;
                return (
                  <div
                    key={s.label}
                    style={{
                      padding: "18px 16px", borderRadius: 10, overflow: "hidden",
                      background: s.gradient, position: "relative",
                      border: `1px solid ${s.color}18`,
                      transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${s.color}12`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <div style={{ position: "absolute", top: -10, right: -10, width: 60, height: 60, borderRadius: "50%", background: `radial-gradient(circle, ${s.color}10, transparent 70%)`, pointerEvents: "none" }} />
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, position: "relative" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <I size={16} style={{ color: s.color }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "var(--proof-text)", fontFamily: "var(--font-mono)", letterSpacing: "-0.5px", lineHeight: 1.2 }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", fontWeight: 500, marginTop: 1 }}>{s.label}</div>
                        <div style={{ fontSize: 9, color: "var(--proof-text-muted)", marginTop: 1 }}>{s.sub}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ════════════════ TEST CATEGORIES — treemap bars ════════════════ */}
          <section style={{ padding: "24px 0 28px" }}>
            <div style={{ marginBottom: 14 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Coverage</span>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--proof-text)", letterSpacing: "-0.5px", marginTop: 2 }}>Test Categories</div>
            </div>
            <div style={{ display: "flex", gap: 6, height: 100, alignItems: "flex-end" }}>
              {Object.entries(summary.byCategory).map(([cat, count], i) => {
                const colors = ["#2563eb", "#10b981", "#f59e0b", "#f97316", "#8b5cf6"];
                const c = colors[i % colors.length];
                const pct = Math.round((count / testCount) * 100);
                const h = Math.max(30, pct * 1.0);
                return (
                  <div key={cat} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: c, fontFamily: "var(--font-mono)" }}>{count}</div>
                    <div
                      style={{
                        width: "100%", height: `${h}%`, borderRadius: "6px 6px 2px 2px",
                        background: `linear-gradient(180deg, ${c}, ${c}60)`,
                        transition: "height 0.4s, box-shadow 0.2s",
                        cursor: "pointer", boxShadow: `0 0 20px ${c}10`,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 0 30px ${c}30`}
                      onMouseLeave={(e) => e.currentTarget.style.boxShadow = `0 0 20px ${c}10`}
                    />
                    <div style={{ fontSize: 10, color: "var(--proof-text-secondary)", fontWeight: 600, whiteSpace: "nowrap" }}>{cat}</div>
                    <div style={{ fontSize: 9, color: "var(--proof-text-muted)" }}>{pct}%</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ════════════════ ENVIRONMENT HEALTH — server rack style ════════════════ */}
          <section style={{ padding: "24px 0 28px" }}>
            <div style={{ marginBottom: 14 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Infrastructure</span>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--proof-text)", letterSpacing: "-0.5px", marginTop: 2 }}>Environment Health</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {(ENV_SUMMARY.length > 0 ? ENV_SUMMARY : ["QA", "UAT", "PROD"].map((label) => {
                const runs = RUNS.filter((r) => r.env === label);
                const avg = runs.length > 0 ? Math.round(runs.reduce((s, r) => s + r.passPct, 0) / runs.length) : 0;
                const sorted = [...runs].sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime());
                const latest = sorted[0];
                const trend = sorted[1] ? latest.passPct - sorted[1].passPct : 0;
                const envColors: Record<string, string> = { QA: "#8b5cf6", UAT: "#f59e0b", PROD: "#10b981" };
                return { label, passRate: avg, trend, failures: latest?.failures ?? 0, color: envColors[label] };
              })).map((env) => (
                <div
                  key={env.label}
                  style={{
                    padding: "16px 18px", borderRadius: 10,
                    background: "var(--proof-env-card)",
                    border: `1px solid ${env.color}20`,
                    position: "relative", overflow: "hidden",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${env.color}50`; e.currentTarget.style.boxShadow = `0 0 30px ${env.color}08`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${env.color}20`; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {/* decorative glow */}
                  <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: `radial-gradient(circle, ${env.color}08, transparent 70%)`, pointerEvents: "none" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, position: "relative" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--proof-text)", letterSpacing: "-0.3px" }}>{env.label}</div>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: env.color, boxShadow: `0 0 8px ${env.color}`, animation: env.failures > 0 ? "pulseDot 1.5s ease-in-out infinite" : "none" }} />
                  </div>

                  {/* animated pass rate bar */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: "var(--proof-text-muted)" }}>Pass Rate</span>
                      <span style={{ fontSize: 24, fontWeight: 900, color: env.color, fontFamily: "var(--font-mono)", letterSpacing: "-0.5px", lineHeight: 1 }}>{env.passRate}%</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: "var(--proof-bar-track)", overflow: "hidden" }}>
                      <div style={{ width: `${env.passRate}%`, height: "100%", borderRadius: 2, background: `linear-gradient(90deg, ${env.color}80, ${env.color})`, transition: "width 1s ease" }} />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 14, fontSize: 11, position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <TrendingUp size={11} style={{ color: env.trend >= 0 ? "var(--proof-green)" : "var(--proof-red)" }} />
                      <span style={{ fontWeight: 600, color: env.trend >= 0 ? "var(--proof-green)" : "var(--proof-red)" }}>{env.trend >= 0 ? "+" : ""}{env.trend}%</span>
                      <span style={{ color: "var(--proof-text-muted)" }}>trend</span>
                    </div>
                    {env.failures > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ fontWeight: 600, color: "var(--proof-red)" }}>{env.failures}</span>
                        <span style={{ color: "var(--proof-text-muted)" }}>failures</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ════════════════ USE CASES — expandable tiles ════════════════ */}
          <section style={{ padding: "24px 0 28px" }}>
            <div style={{ marginBottom: 14 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Scenarios</span>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--proof-text)", letterSpacing: "-0.5px", marginTop: 2 }}>Use Cases</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[
                { icon: Shield, title: "Deploy Gate", desc: "Block promotion if UAT pass rate drops below 95%", color: "#f97316" },
                { icon: GitCompare, title: "Diff Review", desc: "Compare two runs to spot regressions before they ship", color: "#10b981" },
                { icon: Activity, title: "Trend Watch", desc: "Monitor pass rates per env over time — catch drift early", color: "#2563eb" },
                { icon: Zap, title: "AI Debug", desc: "Ask the Copilot to explain a failed diff or generate new tests", color: "#f59e0b" },
                { icon: Globe, title: "Env Parity", desc: "Ensure consistent behavior across QA, UAT, and PROD", color: "#06b6d4" },
                { icon: Bug, title: "Test Ops", desc: `Manage ${testCount}+ auto-discovered tests across ${suiteCount} suites`, color: "#ef4444" },
              ].map((uc) => {
                const I = uc.icon;
                return (
                  <div
                    key={uc.title}
                    style={{
                      padding: "14px 16px", borderRadius: 10, cursor: "default",
                      background: `linear-gradient(135deg, ${uc.color}06, transparent 80%)`,
                      border: `1px solid ${uc.color}12`,
                      transition: "all 0.25s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `linear-gradient(135deg, ${uc.color}12, ${uc.color}04 80%)`;
                      e.currentTarget.style.borderColor = `${uc.color}35`;
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = `0 8px 24px ${uc.color}10`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `linear-gradient(135deg, ${uc.color}06, transparent 80%)`;
                      e.currentTarget.style.borderColor = `${uc.color}12`;
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${uc.color}12`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                      <I size={14} style={{ color: uc.color }} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--proof-text)", marginBottom: 3 }}>{uc.title}</div>
                    <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", lineHeight: 1.5 }}>{uc.desc}</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ════════════════ FEATURES — honeycomb ════════════════ */}
          <section style={{ padding: "24px 0 28px", position: "relative" }}>
            {/* repeating honeycomb background */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.04, color: "var(--proof-text-muted)" }}>
              <defs>
                <pattern id="honeycomb" x="0" y="0" width="56" height="97" patternUnits="userSpaceOnUse">
                  <path d="M28 2L54 18v32L28 66 2 50V18L28 2z" fill="none" stroke="currentColor" strokeWidth="0.8" />
                  <path d="M28 34L54 50v32L28 82 2 66V34L28 34z" fill="none" stroke="currentColor" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#honeycomb)" />
            </svg>
            <div style={{ marginBottom: 14, position: "relative" }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Capabilities</span>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--proof-text)", letterSpacing: "-0.5px", marginTop: 2 }}>Platform Features</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "4px" }}>
              {([
                { f: FEATURES[0], col: "1 / span 2", row: 1 },
                { f: FEATURES[1], col: "3 / span 2", row: 1 },
                { f: FEATURES[2], col: "5 / span 2", row: 1 },
                { f: FEATURES[3], col: "2 / span 2", row: 2 },
                { f: FEATURES[4], col: "4 / span 2", row: 2 },
                { f: FEATURES[5], col: "1 / span 2", row: 3 },
                { f: FEATURES[6], col: "3 / span 2", row: 3 },
                { f: FEATURES[7], col: "5 / span 2", row: 3 },
              ] as const).map(({ f, col, row }) => {
                const I = f.icon;
                return (
                  <div
                    key={f.title}
                    style={{
                      gridColumn: col,
                      gridRow: row,
                      clipPath: "polygon(50% 2%, 97% 22%, 97% 78%, 50% 98%, 3% 78%, 3% 22%)",
                      padding: "30px 22px 22px",
                      background: `linear-gradient(160deg, ${f.color}08, transparent 70%)`,
                      border: `1px solid ${f.color}14`,
                      transition: "all 0.25s ease",
                      cursor: "default",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `linear-gradient(160deg, ${f.color}14, ${f.color}03 70%)`;
                      e.currentTarget.style.borderColor = `${f.color}35`;
                      e.currentTarget.style.transform = "scale(1.04)";
                      e.currentTarget.style.zIndex = "10";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `linear-gradient(160deg, ${f.color}08, transparent 70%)`;
                      e.currentTarget.style.borderColor = `${f.color}14`;
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.zIndex = "1";
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${f.color}14`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                      <I size={14} style={{ color: f.color }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text)", marginBottom: 4 }}>{f.title}</div>
                    <div style={{ fontSize: 10, color: "var(--proof-text-secondary)", lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ════════════════ TECH STACK — ecosystem ════════════════ */}
          <section style={{ padding: "24px 0 28px" }}>
            <div style={{ marginBottom: 14 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Architecture</span>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--proof-text)", letterSpacing: "-0.5px", marginTop: 2 }}>Tech Stack</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { icon: Box, name: "React 19", desc: "Concurrent rendering, Suspense", color: "#2563eb" },
                { icon: Zap, name: "Vite 7", desc: "Instant HMR, optimized builds", color: "#8b5cf6" },
                { icon: Server, name: "TypeScript 5.9", desc: "Full type safety, 16 pages", color: "#2563eb" },
                { icon: Cpu, name: "Wouter", desc: "2KB SPA routing", color: "#10b981" },
                { icon: PieChart, name: "Recharts", desc: "Responsive charts", color: "#f59e0b" },
                { icon: Lock, name: "localStorage", desc: "Client-only persistence", color: "#f97316" },
                { icon: Cloud, name: "GitHub Actions", desc: "CI/CD + scheduler", color: "#ef4444" },
                { icon: Route, name: "Lucide Icons", desc: "Consistent icon system", color: "#06b6d4" },
              ].map((t) => {
                const I = t.icon;
                return (
                  <div
                    key={t.name}
                    style={{
                      padding: "10px 14px", borderRadius: 8,
                      background: "var(--proof-subtle-bg)",
                      border: "1px solid var(--proof-border)",
                      display: "flex", alignItems: "center", gap: 10,
                      transition: "all 0.2s",
                      flex: "1 0 auto", minWidth: 180,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${t.color}30`; e.currentTarget.style.background = `${t.color}06`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--proof-border)"; e.currentTarget.style.background = "var(--proof-subtle-bg)"; }}
                  >
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: `${t.color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <I size={12} style={{ color: t.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--proof-text)" }}>{t.name}</div>
                      <div style={{ fontSize: 9, color: "var(--proof-text-muted)" }}>{t.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ════════════════ CTA — full-width splash ════════════════ */}
          <section style={{ padding: "28px 0" }}>
            <div
              style={{
                padding: "28px 32px", borderRadius: 12, position: "relative", overflow: "hidden",
                background: "var(--proof-cta-bg)",
                border: "1px solid rgba(37,99,235,0.2)",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap",
              }}
            >
              <div style={{ position: "absolute", bottom: -30, left: -30, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.08), transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "relative" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--proof-text)", marginBottom: 3 }}>Ready to explore?</div>
                <div style={{ fontSize: 12, color: "var(--proof-text-secondary)" }}>Start with the Dashboard or dive into the full test registry.</div>
              </div>
              <div style={{ display: "flex", gap: 10, position: "relative" }}>
                <button onClick={() => navigate("/")} className="proof-button-primary" style={{ fontSize: 13, padding: "9px 20px", display: "flex", alignItems: "center", gap: 6 }}>
                  <BarChart3 size={14} /> Dashboard
                </button>
                <button onClick={() => navigate("/suites")} className="proof-button" style={{ fontSize: 13, padding: "9px 20px", display: "flex", alignItems: "center", gap: 6 }}>
                  <Bug size={14} /> Test Manager
                </button>
              </div>
            </div>
          </section>

          <div style={{ fontSize: 9, color: "var(--proof-text-muted)", textAlign: "center", padding: "16px 0 24px" }}>
            A.W.A.R.E. v2.0.0 · {RUNS.length} runs · {testCount} tests · {suiteCount} suites ·{' '}
            <a href="https://github.com/ruake/AWARE" target="_blank" rel="noreferrer" style={{ color: "var(--proof-blue)", textDecoration: "none" }}>GitHub</a>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
