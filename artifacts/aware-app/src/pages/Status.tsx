import React from "react";
import { AppLayout } from "@/components/aware/AppLayout";
import { useLocation } from "wouter";
import {
  Github, Check, LayoutDashboard, Play, GitCompare, Code2, Copy,
  Activity, Calendar, Server, Zap, Shield, BarChart3,
  ChevronRight, AlertCircle, Download, Clock, Box,
} from "lucide-react";
import { RUNS, computeRunFrequency } from "@/lib/data";
import { getSchedulerStatus } from "@/lib/data";
import { generateCiConfigYaml, downloadCiConfig } from "@/lib/ciConfig";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { HeatmapCalendar } from "@/components/aware/HeatmapCalendar";

const HEALTH = { healthy: "var(--proof-green)", degraded: "var(--proof-yellow)", error: "var(--proof-red)" };

const STAGES = [
  { id: "code", n: "Code Push", icon: Code2, c: "#2563eb", d: "Push triggers CI pipeline" },
  { id: "ci", n: "GitHub Actions", icon: Github, c: "#8b5cf6", d: "Workflow dispatches tests" },
  { id: "test", n: "Test Execution", icon: Server, c: "#f59e0b", d: "Playwright + pytest across 6 envs" },
  { id: "ingest", n: "Results Ingest", icon: Zap, c: "#10b981", d: "Outcomes pushed to AWARE store" },
  { id: "analyze", n: "Analysis", icon: Activity, c: "#f97316", d: "Rates, diffs, anomalies computed" },
  { id: "gate", n: "Promotion Gate", icon: Shield, c: "#ef4444", d: "≥95% pass rate required for PROD" },
];

export default function Status() {
  const [, navigate] = useLocation();
  const { Toast } = useSimpleToast();
  const freq = React.useMemo(() => computeRunFrequency(), []);
  const sched = getSchedulerStatus();
  const [stage, setStage] = React.useState(0);
  const [showYaml, setShowYaml] = React.useState(false);
  const [yamlCopied, setYamlCopied] = React.useState(false);

  React.useEffect(() => {
    const t = setInterval(() => setStage((s) => (s + 1) % STAGES.length), 2200);
    return () => clearInterval(t);
  }, []);

  const yamlContent = React.useMemo(() => generateCiConfigYaml(), []);
  const copyYaml = () => { navigator.clipboard.writeText(yamlContent).then(() => { setYamlCopied(true); setTimeout(() => setYamlCopied(false), 2000); }); };

  const sorted = [...RUNS].sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime());
  const lastRun = sorted[0];
  const today = sorted.filter((r) => r.started.startsWith(new Date().toISOString().slice(0, 10)));

  return (
    <AppLayout activeHref="/ci-pipeline">
      <div className="proof-page" style={{ overflow: "hidden" }}>
        {/* ══════════ FULL-BLEED DASHBOARD HEADER ══════════ */}
        <section style={{
          background: "var(--proof-hero-status)",
          borderBottom: "1px solid rgba(37,99,235,0.12)", position: "relative", overflow: "hidden",
          padding: "40px 32px 28px",
        }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.06), transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.04), transparent 70%)", pointerEvents: "none" }} />

          <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 18 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: "linear-gradient(135deg, #2563eb, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 24px rgba(37,99,235,0.25)" }}>
                <Github size={20} color="white" />
              </div>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--proof-text)", letterSpacing: "-0.8px", margin: 0 }}>CI Pipeline</h1>
                <p style={{ fontSize: 12, color: "var(--proof-text-secondary)", margin: "2px 0 0", lineHeight: 1.5 }}>
                  GitHub Actions → test results → promotion decision · {sorted.length} runs, {sched.summary.total} suites, {sched.summary.scheduled} scheduled
                </p>
              </div>
            </div>

            {/* live status strip — no cards, connected badges */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {/* scheduler health */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 6, background: `${HEALTH[sched.status] || "#94a3b8"}12`, border: `1px solid ${HEALTH[sched.status] || "#94a3b8"}20`, animation: "fade-in 0.3s ease-out" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: HEALTH[sched.status] || "var(--proof-text-muted)", boxShadow: `0 0 6px ${HEALTH[sched.status]}`, animation: "pulseDot 2s ease-in-out infinite" }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: HEALTH[sched.status] || "var(--proof-text-secondary)", textTransform: "capitalize" }}>{sched.status}</span>
                <span style={{ fontSize: 9, color: "var(--proof-text-muted)" }}>scheduler</span>
              </div>
              {/* latest pass rate */}
              {lastRun && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 6, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)", animation: "fade-in 0.3s ease-out 0.1s both" }}>
                  <BarChart3 size={11} style={{ color: "#10b981" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981" }}>{lastRun.passPct}%</span>
                  <span style={{ fontSize: 9, color: "var(--proof-text-muted)" }}>latest run</span>
                </div>
              )}
              {/* runs today */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 6, background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.18)", animation: "fade-in 0.3s ease-out 0.2s both" }}>
                <Activity size={11} style={{ color: "#2563eb" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb" }}>{today.length}</span>
                <span style={{ fontSize: 9, color: "var(--proof-text-muted)" }}>runs today</span>
              </div>
              {/* dispatches */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 6, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.18)", animation: "fade-in 0.3s ease-out 0.3s both" }}>
                <Zap size={11} style={{ color: "#8b5cf6" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#8b5cf6" }}>{sched.summary.dispatched}</span>
                <span style={{ fontSize: 9, color: "var(--proof-text-muted)" }}>dispatches</span>
              </div>
            </div>
          </div>
        </section>

        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          {/* ══════════ PIPELINE FLOW — animated nodes with glow ══════════ */}
          <section style={{ padding: "28px 0 20px" }}>
            <div style={{ marginBottom: 14 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Flow</span>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--proof-text)", letterSpacing: "-0.5px", marginTop: 2 }}>Pipeline</div>
            </div>
            <div style={{
              padding: "20px 16px", borderRadius: 10,
              background: "var(--proof-flow-bg)",
              border: "1px solid rgba(37,99,235,0.1)",
            }}>
              <div style={{ display: "flex", alignItems: "center", overflowX: "auto", paddingBottom: 4 }}>
                {STAGES.map((s, i) => {
                  const I = s.icon;
                  const active = stage === i;
                  const done = stage > i;
                  return (
                    <React.Fragment key={s.id}>
                      <div
                        onClick={() => setStage(i)}
                        style={{
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                          cursor: "pointer", minWidth: 82, flexShrink: 0,
                        }}
                      >
                        {/* node */}
                        <div style={{
                          width: 54, height: 54, borderRadius: 14,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.35s",
                          transform: active ? "scale(1.12)" : "scale(1)",
                          border: `2px solid ${done ? s.c : active ? s.c : "var(--proof-border)"}`,
                          background: done ? `${s.c}18` : active ? `${s.c}12` : "transparent",
                          boxShadow: active ? `0 0 25px ${s.c}25, 0 0 60px ${s.c}08` : "none",
                        }}>
                          {done ? (
                            <div style={{ width: 22, height: 22, borderRadius: "50%", background: s.c, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 10px ${s.c}` }}>
                              <Check size={11} color="white" />
                            </div>
                          ) : (
                            <I size={16} style={{ color: active ? s.c : "var(--proof-text-muted)" }} />
                          )}
                        </div>
                        <span style={{
                          fontSize: 9, fontWeight: active ? 700 : 500, textAlign: "center",
                          color: active ? s.c : done ? "var(--proof-green)" : "var(--proof-text-muted)",
                          maxWidth: 72, lineHeight: 1.2, transition: "color 0.3s",
                        }}>{s.n}</span>
                      </div>
                      {/* connector */}
                      {i < STAGES.length - 1 && (
                        <div style={{
                          flex: 1, minWidth: 14, height: 2, borderRadius: 1,
                          margin: "0 2px", marginBottom: 20,
                          background: done ? s.c : "var(--proof-border)",
                          transition: "background 0.5s",
                          position: "relative",
                        }}>
                          {active && (
                            <div style={{
                              position: "absolute", inset: 0, borderRadius: 1,
                              background: `linear-gradient(90deg, ${STAGES[i].c}, ${STAGES[i+1].c})`,
                              animation: "shimmer 1.5s ease-in-out infinite",
                              backgroundSize: "200% 100%",
                            }} />
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              {/* active detail */}
              <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: `${STAGES[stage].c}08`, border: `1px solid ${STAGES[stage].c}15` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: STAGES[stage].c, boxShadow: `0 0 8px ${STAGES[stage].c}`, animation: "pulseDot 1.5s ease-in-out infinite" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: STAGES[stage].c }}>{STAGES[stage].n}</span>
                  <span style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginLeft: 4 }}>{STAGES[stage].d}</span>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════ METRICS — dashboard row ══════════ */}
          <section style={{ padding: "20px 0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {[
                { val: sched.summary.total, lab: "Suites", sub: `${sched.summary.scheduled} scheduled`, col: "#2563eb", icon: Calendar },
                { val: sched.summary.dispatched, lab: "Dispatches", sub: `${sched.summary.running} running`, col: "#10b981", icon: Play },
                { val: sorted.length, lab: "Runs", sub: `${freq.avgIntervalHours}h avg interval`, col: "#f59e0b", icon: Activity },
                { val: sched.lastRun ? Math.round((Date.now() - new Date(sched.lastRun).getTime()) / 3600000) + "h" : "—", lab: "Since Last Run", sub: sched.lastRun || "N/A", col: "#8b5cf6", icon: Clock },
              ].map((m) => {
                const I = m.icon;
                return (
                  <div key={m.lab} style={{
                    padding: "14px 12px", borderRadius: 8, position: "relative", overflow: "hidden",
                    background: `linear-gradient(135deg, ${m.col}06, transparent)`,
                    border: `1px solid ${m.col}12`,
                    transition: "all 0.2s",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${m.col}30`; e.currentTarget.style.background = `linear-gradient(135deg, ${m.col}10, ${m.col}03)`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${m.col}12`; e.currentTarget.style.background = `linear-gradient(135deg, ${m.col}06, transparent)`; }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: m.col, fontFamily: "var(--font-mono)", letterSpacing: "-0.5px", lineHeight: 1 }}>{m.val}</div>
                        <div style={{ fontSize: 10, color: "var(--proof-text-secondary)", fontWeight: 600, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.3px" }}>{m.lab}</div>
                      </div>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: `${m.col}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <I size={12} style={{ color: m.col }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 9, color: "var(--proof-text-muted)", marginTop: 4 }}>{m.sub}</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ══════════ SUITE SCHEDULES — vertical timeline ══════════ */}
          <section style={{ padding: "20px 0" }}>
            <div style={{ marginBottom: 14 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Schedule</span>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--proof-text)", letterSpacing: "-0.5px", marginTop: 2 }}>Suites</div>
            </div>
            <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 0 }}>
              {/* timeline line */}
              <div style={{ position: "absolute", left: 18, top: 8, bottom: 8, width: 2, background: "linear-gradient(180deg, #2563eb, #10b981, #f59e0b, #8b5cf6, #f97316, #ef4444)", borderRadius: 1, opacity: 0.3 }} />
              {sched.suites.map((suite) => {
                const ok = suite.lastConclusion === "success";
                const statusColor = ok ? "#10b981" : suite.lastConclusion === "failure" ? "#ef4444" : "var(--proof-text-muted)";
                return (
                  <div key={suite.id} style={{ display: "flex", gap: 14, padding: "8px 0", alignItems: "stretch" }}>
                    {/* dot */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 38, position: "relative", zIndex: 1 }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: statusColor, boxShadow: `0 0 8px ${statusColor}`, marginTop: 4, flexShrink: 0 }} />
                    </div>
                    {/* content */}
                    <div style={{
                      flex: 1, padding: "10px 14px", borderRadius: 8,
                      background: "var(--proof-subtle-bg)", border: "1px solid var(--proof-border)",
                      transition: "all 0.2s",
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${statusColor}30`; e.currentTarget.style.background = `${statusColor}04`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--proof-border)"; e.currentTarget.style.background = "var(--proof-subtle-bg)"; }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text)" }}>{suite.name}</div>
                          <div style={{ fontSize: 10, color: "var(--proof-text-muted)", fontFamily: "var(--font-mono)", marginTop: 1 }}>{suite.schedule || "manual trigger"}</div>
                        </div>
                        <span style={{ fontSize: 10, color: statusColor, fontWeight: 600, fontFamily: "var(--font-mono)" }}>{suite.lastConclusion || "—"}</span>
                      </div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                        {suite.environments.slice(0, 3).map((e) => (
                          <span key={e} style={{ fontSize: 8, padding: "1px 5px", borderRadius: 3, background: "rgba(37,99,235,0.06)", color: "var(--proof-blue)", border: "1px solid rgba(37,99,235,0.1)" }}>{e}</span>
                        ))}
                        {suite.environments.length > 3 && <span style={{ fontSize: 8, color: "var(--proof-text-muted)" }}>+{suite.environments.length - 3}</span>}
                        {suite.runners.map((r) => (
                          <span key={r} style={{ fontSize: 8, padding: "1px 5px", borderRadius: 3, background: "rgba(245,158,11,0.08)", color: "#f59e0b" }}>{r}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ══════════ RECENT DISPATCHES + LATEST RUNS — two panel ══════════ */}
          <section style={{ padding: "20px 0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {/* Dispatches — timeline feed */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--proof-text)", letterSpacing: "-0.2px" }}>Recent Dispatches</div>
                    <div style={{ fontSize: 10, color: "var(--proof-text-muted)" }}>Last {Math.min(sched.recentDispatches.length, 6)} of {sched.recentDispatches.length}</div>
                  </div>
                  <Zap size={13} style={{ color: "var(--proof-text-muted)" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {sched.recentDispatches.length > 0 ? (
                    sched.recentDispatches.slice(0, 6).map((d, i) => (
                      <div
                        key={`${d.timestamp}-${i}`}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "7px 10px", borderRadius: 6,
                          background: "var(--proof-subtle-bg015)",
                          border: "1px solid var(--proof-border)",
                          animation: `fade-in 0.2s ease-out ${i * 0.04}s both`,
                        }}
                      >
                        <div style={{ width: 24, height: 24, borderRadius: 5, background: "rgba(37,99,235,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Zap size={10} style={{ color: "#2563eb" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--proof-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {d.suite}
                          </div>
                          <div style={{ fontSize: 9, color: "var(--proof-text-muted)", fontFamily: "var(--font-mono)" }}>
                            {new Date(d.timestamp).toLocaleString()} · {d.dispatched} envs
                          </div>
                        </div>
                        {d.failed > 0 ? (
                          <span style={{ fontSize: 9, color: "var(--proof-red)", fontWeight: 600, flexShrink: 0 }}>{d.failed} fail</span>
                        ) : (
                          <Check size={11} style={{ color: "var(--proof-green)", flexShrink: 0 }} />
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 11, color: "var(--proof-text-muted)", textAlign: "center", padding: 20 }}>
                      No dispatches yet. The scheduler activates on the next cron cycle.
                    </div>
                  )}
                </div>
              </div>

              {/* Latest Runs — feed */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--proof-text)", letterSpacing: "-0.2px" }}>Latest Runs</div>
                    <div style={{ fontSize: 10, color: "var(--proof-text-muted)" }}>Most recent {Math.min(sorted.length, 6)}</div>
                  </div>
                  <button onClick={() => navigate("/runs")} className="proof-button proof-button-xs" style={{ fontSize: 9 }}>View all</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {sorted.slice(0, 6).map((run) => (
                    <div
                      key={run.id}
                      onClick={() => navigate(`/runs/${run.id}`)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                        padding: "7px 10px", borderRadius: 6,
                        border: "1px solid var(--proof-border)", transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "var(--proof-blue)30"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--proof-border)"; }}
                    >
                      <div style={{ width: 3, height: 24, borderRadius: 2, background: run.passPct >= 95 ? "var(--proof-green)" : run.passPct >= 70 ? "var(--proof-yellow)" : "var(--proof-red)", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--proof-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{run.label}</div>
                        <div style={{ fontSize: 9, color: "var(--proof-text-muted)", fontFamily: "var(--font-mono)" }}>{run.env} · {new Date(run.started).toLocaleString()}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: run.passPct >= 95 ? "var(--proof-green)" : run.passPct >= 70 ? "var(--proof-yellow)" : "var(--proof-red)", fontFamily: "var(--font-mono)", lineHeight: 1 }}>{run.passPct}%</div>
                        {run.failures > 0 && <div style={{ fontSize: 9, color: "var(--proof-red)", fontWeight: 600 }}>{run.failures}f</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ══════════ YAML — code viewer ══════════ */}
          <section style={{ padding: "20px 0" }}>
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Configuration</span>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--proof-text)", letterSpacing: "-0.5px", marginTop: 2 }}>CI Config</div>
            </div>
            <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--proof-border)" }}>
              {/* tab bar */}
              <div style={{ display: "flex", alignItems: "center", padding: "8px 14px", background: "var(--proof-tab-bar)", borderBottom: "1px solid var(--proof-border)", gap: 10 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {["red", "yellow", "green"].map((c) => (
                    <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c === "red" ? "#ef4444" : c === "yellow" ? "#f59e0b" : "#10b981" }} />
                  ))}
                </div>
                <span style={{ fontSize: 10, color: "var(--proof-text-muted)", fontFamily: "var(--font-mono)", flex: 1 }}>aware-test-config.yml</span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => setShowYaml(!showYaml)} className="proof-button proof-button-xs" style={{ fontSize: 9, padding: "2px 8px" }}>{showYaml ? "Hide" : "Show"}</button>
                  <button onClick={copyYaml} className="proof-button proof-button-xs" style={{ fontSize: 9, padding: "2px 8px", color: yamlCopied ? "var(--proof-green)" : undefined }}>
                    {yamlCopied ? <Check size={9} /> : <Copy size={9} />}
                  </button>
                  <button onClick={downloadCiConfig} className="proof-button proof-button-xs" style={{ fontSize: 9, padding: "2px 8px" }}>
                    <Download size={9} /> Download
                  </button>
                </div>
              </div>
              {showYaml && (
                <pre style={{ margin: 0, padding: 12, fontSize: 9.5, lineHeight: 1.6, fontFamily: "var(--font-mono)", color: "var(--proof-text)", background: "var(--proof-code-bg)", maxHeight: 280, overflow: "auto" }}>
                  {yamlContent.split("\n").slice(0, 40).join("\n")}
                </pre>
              )}
            </div>
          </section>

          {/* ══════════ RUN FREQUENCY HEATMAP ══════════ */}
          <section style={{ padding: "20px 0" }}>
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Monitoring</span>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--proof-text)", letterSpacing: "-0.5px", marginTop: 2 }}>Run Frequency</div>
            </div>
            <div style={{ padding: 16, borderRadius: 10, background: "var(--proof-subtle-bg)", border: "1px solid var(--proof-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: "var(--proof-text-muted)" }}>
                  {freq.totalRuns} runs · avg {freq.runsPerDay}/day · ~{freq.avgIntervalHours}h between
                </div>
                {freq.gaps.length > 0 && (
                  <div style={{ fontSize: 9, color: "var(--proof-red)", display: "flex", alignItems: "center", gap: 3 }}>
                    <AlertCircle size={9} /> {freq.gaps.length} gap{freq.gaps.length > 1 ? "s" : ""}
                  </div>
                )}
              </div>
              <HeatmapCalendar
                data={freq.byDay}
                onDayClick={(day) => { if (day) Object.entries(day.envs).map(([e, c]) => `${e}: ${c}`).join(", "); }}
              />
            </div>
          </section>

          {/* ══════════ QUICK NAV — pill strip ══════════ */}
          <section style={{ padding: "20px 0 28px" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { href: "/", label: "Dashboard", icon: LayoutDashboard, desc: "Promotion readiness" },
                { href: "/runs", label: "All Runs", icon: Play, desc: "Run history" },
                { href: "/compare", label: "Compare", icon: GitCompare, desc: "Baseline vs candidate" },
                { href: "/start", label: "New Run", icon: Zap, desc: "Trigger regression" },
              ].map((item) => {
                const I = item.icon;
                return (
                  <button
                    key={item.href}
                    onClick={() => navigate(item.href)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 8, cursor: "pointer",
                      border: "1px solid var(--proof-border)", background: "var(--proof-subtle-bg)",
                      color: "var(--proof-text)", transition: "all 0.15s", fontSize: 12,
                      flex: "1 0 auto",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(37,99,235,0.4)"; e.currentTarget.style.background = "rgba(37,99,235,0.06)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--proof-border)"; e.currentTarget.style.background = "var(--proof-subtle-bg)"; }}
                  >
                    <I size={14} style={{ color: "var(--proof-blue)", flexShrink: 0 }} />
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 600 }}>{item.label}</div>
                      <div style={{ fontSize: 9, color: "var(--proof-text-secondary)" }}>{item.desc}</div>
                    </div>
                    <ChevronRight size={10} style={{ color: "var(--proof-text-muted)", marginLeft: "auto", flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          </section>

          <div style={{ fontSize: 9, color: "var(--proof-text-muted)", textAlign: "center", padding: "0 0 24px" }}>
            CI Pipeline · {sorted.length} runs · {sched.summary.total} suites · {sched.summary.dispatched} dispatches · {freq.avgIntervalHours}h avg interval
          </div>
        </div>
      </div>
      {Toast}
    </AppLayout>
  );
}
