import React from "react";
import { AppLayout } from "./_shared/AppLayout";
import "./_group.css";

export function RunDetail() {
  const dummyTests = Array.from({length: 20}).map((_, i) => {
    const isFail = i === 3 || i === 8;
    return {
      id: `test_${i}`,
      name: `Check ${i%2===0?'Geo':'Locale'} match for /api/v${i%3+1}/data`,
      status: isFail ? "FAIL" : "PASS",
      statusClass: isFail ? "gcp-badge-fail" : "gcp-badge-pass",
      duration: `${120 + i*15}ms`,
      category: i%3===0 ? "geo-match" : i%2===0 ? "locale-split" : "url-health",
      suite: "full_suite"
    };
  });

  return (
    <AppLayout activeTab="detail">
      <div className="h-[calc(100vh-100px)] flex flex-col gap-4 max-w-[1800px] mx-auto">
        
        {/* Sticky Header */}
        <div className="gcp-card p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <span className="gcp-badge gcp-badge-fail text-sm">FAIL</span>
            <h1 className="text-lg font-medium">Prod/Production · PM 892 · EW 2341.1.0</h1>
            <span className="text-[var(--gcp-text-secondary)] gcp-mono text-sm">run_892_2341.1.0_prod_1001</span>
          </div>
          <div className="flex gap-4 text-sm text-[var(--gcp-text-secondary)]">
            <span>Duration: 45m</span>
            <span>Target: Prod/Production</span>
            <a href="#" className="text-[var(--gcp-blue)] hover:underline">View Commit ↗</a>
          </div>
        </div>

        {/* Split View */}
        <div className="flex gap-4 flex-1 overflow-hidden">
          
          {/* Left Panel */}
          <div className="w-[60%] flex flex-col gcp-card overflow-hidden">
            <div className="p-3 border-b border-[var(--gcp-grey)] flex gap-2">
              <input type="text" placeholder="Search tests..." className="gcp-input flex-1" />
              <button className="gcp-button">Filter</button>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="gcp-table">
                <thead className="sticky top-0 bg-[var(--gcp-surface)] z-10">
                  <tr>
                    <th>Test Name</th>
                    <th>Status</th>
                    <th className="text-right">Duration</th>
                    <th>Category</th>
                    <th>Suite</th>
                  </tr>
                </thead>
                <tbody>
                  {dummyTests.map((t, i) => (
                    <tr key={t.id} className={i === 3 ? "bg-[var(--gcp-blue-bg)]" : "cursor-pointer"}>
                      <td className="font-mono text-xs">{t.name}</td>
                      <td><span className={`gcp-badge ${t.statusClass}`}>{t.status}</span></td>
                      <td className="text-right font-mono text-xs text-[var(--gcp-text-secondary)]">{t.duration}</td>
                      <td><span className="px-2 py-1 bg-[var(--gcp-grey-bg)] text-[11px] rounded">{t.category}</span></td>
                      <td className="text-[12px]">{t.suite}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-2 border-t border-[var(--gcp-grey)] text-xs text-[var(--gcp-text-secondary)] bg-[var(--gcp-surface-hover)]">
              Keyboard nav: ↑↓ navigate · Enter open evidence
            </div>
          </div>

          {/* Right Panel (Evidence) */}
          <div className="w-[40%] gcp-card bg-[#1e1e1e] text-[#d4d4d4] flex flex-col overflow-hidden dark:bg-[#1e1e1e]">
            <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#252526]">
              <div className="font-mono text-sm truncate flex-1 pr-4">Check Locale match for /api/v2/data</div>
              <span className="gcp-badge gcp-badge-fail shrink-0">FAIL</span>
            </div>
            
            <div className="flex-1 overflow-auto p-4 space-y-6 font-mono text-[13px] leading-relaxed">
              
              <div>
                <div className="text-[#569cd6] mb-1 font-bold">REQUEST</div>
                <div className="bg-[#1e1e1e] p-3 rounded border border-[#333] select-all">
                  <span className="text-[#c586c0]">curl</span> -X GET \
                  <br/>  -H <span className="text-[#ce9178]">"Accept-Language: fr-FR"</span> \
                  <br/>  -H <span className="text-[#ce9178]">"X-Akamai-Staging: 1"</span> \
                  <br/>  <span className="text-[#4fc1ff]">"https://api.example.com/api/v2/data"</span>
                </div>
              </div>

              <div>
                <div className="text-[#569cd6] mb-1 font-bold">RESPONSE STATUS</div>
                <div className="flex items-center gap-2">
                  <span className="text-[#f44747] font-bold text-lg">503 Service Unavailable</span>
                  <span className="text-[#808080]">(Expected 200 OK)</span>
                </div>
              </div>

              <div>
                <div className="text-[#569cd6] mb-1 font-bold">RESPONSE HEADERS</div>
                <div className="bg-[#1e1e1e] p-3 rounded border border-[#333]">
                  <div><span className="text-[#9cdcfe]">content-type:</span> text/html</div>
                  <div><span className="text-[#9cdcfe]">x-akamai-request-id:</span> 4a9f3b2</div>
                  <div className="text-[#f44747]"><span className="text-[#9cdcfe] text-[#f44747]">x-cache:</span> TCP_MISS</div>
                </div>
              </div>

              <div>
                <div className="text-[#569cd6] mb-1 font-bold">PM VARIABLES (Extracted)</div>
                <div className="bg-[#1e1e1e] p-3 rounded border border-[#333]">
                  <div>PMUSER_LOCALE = <span className="text-[#ce9178]">"en-US"</span> <span className="text-[#f44747]">&lt;-- DRIFT (Expected "fr-FR")</span></div>
                  <div>PMUSER_GEO = <span className="text-[#ce9178]">"EU"</span></div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}