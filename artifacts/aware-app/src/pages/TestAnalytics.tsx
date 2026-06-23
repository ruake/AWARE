import React from "react";
import { CategoryHeatmap } from "@/components/aware/CategoryHeatmap";
import { HeatmapCalendar } from "@/components/aware/HeatmapCalendar";
import { BarChart2 } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

export default function TestAnalytics() {
  const data = Array.from({ length: 30 }).map((_, i) => ({
    name: `Run ${i}`,
    pass: 80 + ((i * 13 + 7) % 100) / 100 * 20,
    fail: ((i * 17 + 3) % 100) / 100 * 20
  }));

  return (
    <div style={{ padding: "40px 60px", maxWidth: 1600, margin: "0 auto" }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: "-1px", display: "flex", alignItems: "center", gap: 16 }}>
          <BarChart2 size={32} style={{ color: "var(--proof-blue)" }} />
          TELEMETRY & TRENDS
        </h1>
        <div style={{ color: "var(--proof-text-secondary)", fontFamily: "var(--font-mono)", marginTop: 8 }}>ANALYTICAL REPORTING</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 24 }}>
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ fontSize: 10, color: "var(--proof-text-secondary)", fontFamily: "var(--font-mono)", marginBottom: 16 }}>GLOBAL PASS RATE</div>
          <div style={{ height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--proof-blue)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--proof-blue)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="pass" stroke="var(--proof-blue)" strokeWidth={2} fillOpacity={1} fill="url(#colorPass)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: 24 }}>
          <CategoryHeatmap data={[{env: "PROD", status: "PASS"}, {env: "QA", status: "FAIL"}]} />
        </div>
        <div className="glass-panel" style={{ padding: 24 }}>
          <HeatmapCalendar data={[]} />
        </div>
      </div>

      <div className="glass-panel" style={{ padding: 24 }}>
        <div style={{ fontSize: 10, color: "var(--proof-text-secondary)", fontFamily: "var(--font-mono)", marginBottom: 24 }}>FLAKINESS INDEX</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, borderBottom: "1px solid var(--proof-border)", paddingBottom: 16, color: "var(--proof-text-secondary)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
          <span>TEST SIGNATURE</span>
          <span>SEVERITY</span>
          <span>TREND</span>
        </div>
        {/* Placeholder for table */}
        <div style={{ padding: 16, fontFamily: "var(--font-mono)", color: "var(--proof-text-muted)" }}>NO FLAKY TESTS DETECTED</div>
      </div>
    </div>
  );
}
