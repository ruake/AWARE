import React, { useSyncExternalStore } from "react";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useSyncedUrlState } from "@/lib/urlState";
import { subscribeToRuns, getRuns, subscribeToDiffRows, getDiffRows } from "@/lib/data";
import { getSelectedEnvSnapshot, subscribeToSelectedEnv } from "@/lib/selectedEnv";
import { getCompareStats, subscribeToSidebarData } from "@/lib/sidebarData";
import { Share2, Github, Zap, GitCompare, ArrowRight, Info } from "lucide-react";

function copy(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function StatCard({
  stat,
  activeFilter,
  baseline,
  candidate,
}: {
  stat: { label: string; value: string | number; color: string; key: string; count: number };
  activeFilter: string | null;
  baseline: string;
  candidate: string;
}) {
  const [, navigate] = useLocation();
  const isActive = stat.key === activeFilter;
  const maxVal = Math.max(stat.count, 1);
  const barWidth = ["total", "passRateDelta"].includes(stat.key)
    ? undefined
    : `${Math.min(100, Math.round((stat.count / maxVal) * 100))}%`;

  return (
    <motion.div
      whileHover={{ background: "var(--proof-surface-hover)", scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() =>
        navigate(
          `/compare?baseline=${baseline}&candidate=${candidate}&filter=${isActive ? "" : stat.key}`,
        )
      }
      style={{
        padding: "8px",
        borderRadius: 8,
        background: isActive ? "var(--proof-surface-active)" : "var(--proof-surface)",
        border: isActive ? `1px solid ${stat.color}` : "1px solid var(--proof-border)",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: isActive ? `0 0 8px ${stat.color}20` : "none",
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          fontFamily: "var(--font-mono)",
          color: stat.color,
          lineHeight: 1,
        }}
      >
        {stat.value}
      </span>
      <span
        style={{
          fontSize: 8,
          fontWeight: 600,
          color: "var(--proof-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {stat.label}
      </span>
      {barWidth && (
        <div
          style={{
            marginTop: 4,
            height: 3,
            borderRadius: 99,
            background: "var(--proof-bar-track)",
            overflow: "hidden",
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: barWidth }}
            style={{
              height: "100%",
              borderRadius: 99,
              background: stat.color,
            }}
          />
        </div>
      )}
    </motion.div>
  );
}

function CompareStatSummary() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const baseline = params.get("baseline");
  const candidate = params.get("candidate");
  const envSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  const allRuns = useSyncExternalStore(subscribeToRuns, getRuns);
  const envRuns =
    envSnap.envIds.length > 0 ? allRuns.filter((r) => envSnap.envIds.includes(r.envId)) : allRuns;
  const effectiveBaseline = baseline || envRuns[envRuns.length - 1]?.id || "";
  const effectiveCandidate = candidate || envRuns[0]?.id || "";
  const { stats, activeFilter } = useSyncExternalStore(subscribeToSidebarData, getCompareStats);

  if (!effectiveBaseline || !effectiveCandidate || stats.length === 0) {
    return (
      <div
        style={{
          padding: "32px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          textAlign: "center",
        }}
      >
        <Info size={24} style={{ color: "var(--proof-text-muted)", opacity: 0.3 }} />
        <div style={{ fontSize: 11, color: "var(--proof-text-muted)", lineHeight: 1.5 }}>
          Select two runs below to compare their test results and performance.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 6,
        padding: "12px",
        borderBottom: "1px solid var(--proof-border)",
        background: "var(--proof-surface-subtle)",
      }}
    >
      {stats.map((s, _idx) => (
        <StatCard
          key={s.key}
          stat={s}
          activeFilter={activeFilter}
          baseline={effectiveBaseline}
          candidate={effectiveCandidate}
        />
      ))}
    </div>
  );
}

function EnvTags({ baseline, candidate }: { baseline: string; candidate: string }) {
  const getStyle = (e: string) =>
    e === "QA"
      ? { color: "var(--proof-purple)", bg: "var(--proof-purple-bg)" }
      : e === "UAT"
        ? { color: "var(--proof-orange)", bg: "var(--proof-orange-bg)" }
        : { color: "var(--proof-green)", bg: "var(--proof-green-bg)" };
  
  const b = getStyle(baseline);
  const c = getStyle(candidate);
  
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ 
          fontSize: 9, 
          fontWeight: 700, 
          padding: "1px 6px", 
          borderRadius: 4, 
          background: b.bg, 
          color: b.color,
          border: `1px solid ${b.color}40`
        }}>
          {baseline}
        </span>
      </div>
      <ArrowRight size={10} style={{ color: "var(--proof-text-muted)" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ 
          fontSize: 9, 
          fontWeight: 700, 
          padding: "1px 6px", 
          borderRadius: 4, 
          background: c.bg, 
          color: c.color,
          border: `1px solid ${c.color}40`
        }}>
          {candidate}
        </span>
      </div>
    </div>
  );
}

export function ComparePanel() {
  const envSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  const runs = useSyncExternalStore(subscribeToRuns, getRuns);
  const diffs = useSyncExternalStore(subscribeToDiffRows, getDiffRows);
  const envRuns =
    envSnap.envIds.length > 0 ? runs.filter((r) => envSnap.envIds.includes(r.envId)) : runs;

  const [baseline, setBaseline] = useSyncedUrlState("baseline", "");
  const [candidate, setCandidate] = useSyncedUrlState("candidate", "");

  const effectiveBaseline = baseline || envRuns[envRuns.length - 1]?.id || "";
  const effectiveCandidate = candidate || envRuns[0]?.id || "";
  const baselineRun = runs.find((r) => r.id === effectiveBaseline);
  const candidateRun = runs.find((r) => r.id === effectiveCandidate);

  const regressions = diffs.filter((d) => d.state === "regression");
  const fixed = diffs.filter((d) => d.state === "fixed");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <CompareStatSummary />

      <div style={{ padding: "16px 12px", borderBottom: "1px solid var(--proof-border)" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--proof-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <GitCompare size={12} /> Selection
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
             <label style={{ fontSize: 9, fontWeight: 600, color: "var(--proof-text-muted)", textTransform: "uppercase" }}>Baseline (Earlier)</label>
             <select
                value={effectiveBaseline}
                onChange={(e) => setBaseline(e.target.value)}
                style={{
                  width: "100%",
                  fontSize: 11,
                  padding: "6px 8px",
                  border: "1px solid var(--proof-border)",
                  borderRadius: 8,
                  background: "var(--proof-surface)",
                  color: "var(--proof-text)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {envRuns.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.env} · {r.label || r.id.slice(0, 8)}
                  </option>
                ))}
              </select>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <motion.button
              whileHover={{ rotate: 180, background: "var(--proof-surface-hover)" }}
              onClick={() => {
                const t = effectiveBaseline;
                setBaseline(effectiveCandidate);
                setCandidate(t);
              }}
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                border: "1px solid var(--proof-border)",
                background: "var(--proof-surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--proof-text-secondary)",
              }}
            >
              ⇄
            </motion.button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
             <label style={{ fontSize: 9, fontWeight: 600, color: "var(--proof-blue-bright)", textTransform: "uppercase" }}>Candidate (Later)</label>
             <select
                value={effectiveCandidate}
                onChange={(e) => setCandidate(e.target.value)}
                style={{
                  width: "100%",
                  fontSize: 11,
                  padding: "6px 8px",
                  border: "1px solid var(--proof-blue)40",
                  borderRadius: 8,
                  background: "var(--proof-surface)",
                  color: "var(--proof-text)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {envRuns.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.env} · {r.label || r.id.slice(0, 8)}
                  </option>
                ))}
              </select>
          </div>

          {baselineRun && candidateRun && (
            <EnvTags baseline={baselineRun.env} candidate={candidateRun.env} />
          )}
        </div>
      </div>

      <div style={{ padding: "12px", borderBottom: "1px solid var(--proof-border)", display: "flex", gap: 6 }}>
        <motion.button
          whileHover={{ background: "var(--proof-surface-hover)" }}
          onClick={() => copy(window.location.href)}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "8px",
            borderRadius: 8,
            border: "1px solid var(--proof-border)",
            background: "var(--proof-surface)",
            cursor: "pointer",
            color: "var(--proof-text-secondary)",
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          <Share2 size={12} /> Share
        </motion.button>
        <motion.button
          whileHover={{ background: "var(--proof-blue-bg)", borderColor: "var(--proof-blue-bright)" }}
          onClick={() => {
            copy(
              `Regression Report\nBaseline: ${baseline}\nCandidate: ${candidate}\nRegressions: ${regressions.length}\nFixed: ${fixed.length}`
            );
          }}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "8px",
            borderRadius: 8,
            border: "1px solid var(--proof-border)",
            background: "var(--proof-surface)",
            cursor: "pointer",
            color: "var(--proof-text-secondary)",
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          <Github size={12} /> Report
        </motion.button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--proof-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
          Comparison Details
        </div>
        
        {baselineRun && candidateRun ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>Tests Analyzed</span>
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{diffs.length}</span>
              </div>
              
              <AnimatePresence>
                {regressions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    style={{
                      padding: "10px",
                      borderRadius: 8,
                      background: "var(--proof-red-bg)",
                      border: "1px solid var(--proof-red)40",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--proof-red)" }} />
                    <div style={{ flex: 1, fontSize: 11, fontWeight: 600, color: "var(--proof-red)" }}>
                      {regressions.length} New Regressions
                    </div>
                  </motion.div>
                )}
                
                {fixed.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    style={{
                      padding: "10px",
                      borderRadius: 8,
                      background: "var(--proof-green-bg)",
                      border: "1px solid var(--proof-green)40",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--proof-green)" }} />
                    <div style={{ flex: 1, fontSize: 11, fontWeight: 600, color: "var(--proof-green)" }}>
                      {fixed.length} Previously Failed Fixed
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {regressions.length === 0 && (
                <div style={{ padding: "16px", textAlign: "center", background: "var(--proof-surface-subtle)", borderRadius: 12, border: "1px dashed var(--proof-border)" }}>
                  <Zap size={20} style={{ color: "var(--proof-green)", marginBottom: 8 }} />
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--proof-text-secondary)" }}>No regressions detected</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--proof-text-muted)" }}>
             <GitCompare size={24} style={{ opacity: 0.2, marginBottom: 12 }} />
             <div style={{ fontSize: 11 }}>Choose runs to start comparison</div>
          </div>
        )}
      </div>
    </div>
  );
}
