import React, { useSyncExternalStore } from "react";
import { useLocation } from "wouter";
import { getAutoDiscoveredTests, subscribeToAutoTests } from "@/lib/data";
import { useTestData } from "@/hooks/useTestData";
import { useSyncedUrlState } from "@/lib/urlState";
import { TestFilters } from "@/components/aware/TestFilters";
import { TestCard } from "@/components/aware/TestCard";
import { TestDetailPanel } from "@/components/aware/TestDetailPanel";

export default function Tests() {
  const { tcs } = useTestData();
  const [, navigate] = useLocation();
  const [search, setSearch] = useSyncedUrlState("q", "");
  const [detailId] = useSyncedUrlState("detail", "");

  const allTests = useSyncExternalStore(subscribeToAutoTests, getAutoDiscoveredTests);

  const filtered = React.useMemo(() => {
    let result = allTests;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allTests, search]);

  const selectedTest = detailId ? (tcs.find((t) => t.id === detailId) ?? null) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <TestFilters search={search} onSearchChange={setSearch} />
      
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'auto', padding: "24px 32px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span className="metric-number" style={{ fontSize: 24, color: "var(--proof-text)" }}>{filtered.length} <span style={{ fontSize: 14, color: "var(--proof-text-secondary)", fontWeight: 500, fontFamily: "var(--font-sans)" }}>TESTS</span></span>
          </div>
          {filtered.slice(0, 50).map((test, i) => (
            <div key={test.id} style={{ animation: "fade-in-up 0.4s ease-out both", animationDelay: `${i * 30}ms` }}>
              <TestCard test={test} onClick={() => navigate(`/tests?detail=${test.id}`)} />
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--proof-text-muted)" }}>No tests found.</div>
          )}
        </div>
        
        {selectedTest && (
          <div style={{ width: 480, flexShrink: 0 }}>
            <TestDetailPanel
              test={selectedTest}
              parentSuite={null}
              onClose={() => navigate("/tests")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
