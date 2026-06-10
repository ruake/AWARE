import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/aware/AppLayout";
import { DIFF_ROWS, getTestCaseById, RUNS, getTestResultsForRun } from "@/lib/data";

import { TestDocTopBar } from "@/components/aware/TestDocTopBar";
import { TestDocSidebar } from "@/components/aware/TestDocSidebar";
import { TestDocChangelog } from "@/components/aware/TestDocChangelog";
import { TestFlowDiagram } from "@/components/aware/TestFlowDiagram";
import { StatusBadge } from "@/components/aware/StatusBadge";

export default function TestDoc() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const testId = params.get("testId") || "";
  const diffRow = DIFF_ROWS.find((d) => d.id === testId);
  const testCase = React.useMemo(() => getTestCaseById(testId), [testId]);
  const latestResult = React.useMemo(() => {
    const name = testCase?.name ?? diffRow?.name;
    if (!name) return null;
    for (const run of RUNS) {
      const results = getTestResultsForRun(run.id);
      const match = results.find((r) => r.name === name);
      if (match) return match;
    }
    return null;
  }, [testCase, diffRow]);
  const testName =
    testCase?.name ?? diffRow?.name ?? (testId || "test_geo_match_us_locale_prod[/us/]");
  const testStatus = diffRow?.candStatus ?? "FAIL";
  const testCategory = testCase?.category ?? diffRow?.category ?? "geo-match";
  const testSuite = "full_suite";

  return (
    <AppLayout activeHref="/tests">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 80px)",
          maxWidth: 1800,
          margin: "0 auto",
          gap: 12,
        }}
      >
        <TestDocTopBar
          testId={testId}
          testName={testName}
          testStatus={testStatus}
          testCategory={testCategory}
          testSuite={testSuite}
          testCase={testCase}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr 300px",
            gap: 12,
            flex: 1,
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          {/* Left sidebar — test metadata */}
          <div style={{ overflowY: "auto", paddingRight: 4 }}>
            <TestDocSidebar testCase={testCase} />
          </div>

          {/* Main content — flow diagram + charts */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              overflowY: "auto",
              paddingRight: 4,
              paddingBottom: 32,
            }}
          >
            {testCase && <TestFlowDiagram testCase={testCase} />}

            <div className="proof-card" style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--proof-grey)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "var(--proof-surface-hover)",
                }}
              >
                <h2 style={{ fontWeight: 500, fontSize: 13 }}>Pass Rate Over Time (7d)</h2>
                <span style={{ fontSize: 20, fontWeight: 700, color: "var(--proof-green)" }}>
                  94.8%
                </span>
              </div>
              <div
                style={{
                  padding: "16px 20px",
                  height: 180,
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 400 120"
                  preserveAspectRatio="none"
                  style={{ overflow: "visible" }}
                >
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--proof-green)" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="var(--proof-green)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <line
                    x1="0"
                    y1="20"
                    x2="400"
                    y2="20"
                    stroke="var(--proof-grey)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <line
                    x1="0"
                    y1="60"
                    x2="400"
                    y2="60"
                    stroke="var(--proof-grey)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <line
                    x1="0"
                    y1="100"
                    x2="400"
                    y2="100"
                    stroke="var(--proof-grey)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <path
                    d="M0,20 L30,20 L60,20 L90,100 L120,20 L150,20 L180,20 L210,20 L240,20 L270,100 L300,20 L330,20 L360,20 L400,20 L400,120 L0,120 Z"
                    fill="url(#areaGradient)"
                  />
                  <path
                    d="M0,20 L30,20 L60,20 L90,100 L120,20 L150,20 L180,20 L210,20 L240,20 L270,100 L300,20 L330,20 L360,20 L400,20"
                    fill="none"
                    stroke="var(--proof-green)"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                  <circle cx="30" cy="20" r="4" fill="var(--proof-green)" />
                  <circle cx="60" cy="20" r="4" fill="var(--proof-green)" />
                  <circle
                    cx="90"
                    cy="100"
                    r="6"
                    fill="var(--proof-red)"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <g transform="translate(90, 115)">
                    <rect
                      x="-40"
                      y="0"
                      width="80"
                      height="20"
                      fill="var(--proof-surface)"
                      stroke="var(--proof-red)"
                      rx="2"
                    />
                    <text
                      x="0"
                      y="14"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                      fill="var(--proof-red)"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      FAIL - Build 889
                    </text>
                  </g>
                  <circle cx="120" cy="20" r="4" fill="var(--proof-green)" />
                  <circle cx="150" cy="20" r="4" fill="var(--proof-green)" />
                  <circle cx="180" cy="20" r="4" fill="var(--proof-green)" />
                  <circle cx="210" cy="20" r="4" fill="var(--proof-green)" />
                  <circle cx="240" cy="20" r="4" fill="var(--proof-green)" />
                  <circle
                    cx="270"
                    cy="100"
                    r="6"
                    fill="var(--proof-red)"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <g transform="translate(270, 115)">
                    <rect
                      x="-40"
                      y="0"
                      width="80"
                      height="20"
                      fill="var(--proof-surface)"
                      stroke="var(--proof-red)"
                      rx="2"
                    />
                    <text
                      x="0"
                      y="14"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                      fill="var(--proof-red)"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      FAIL - Build 891
                    </text>
                  </g>
                  <circle cx="300" cy="20" r="4" fill="var(--proof-green)" />
                  <circle cx="330" cy="20" r="4" fill="var(--proof-green)" />
                  <circle cx="360" cy="20" r="4" fill="var(--proof-green)" />
                  <circle cx="400" cy="20" r="4" fill="var(--proof-green)" />
                </svg>
              </div>
            </div>

            <div className="proof-card" style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  padding: "10px 12px",
                  borderBottom: "1px solid var(--proof-grey)",
                  background: "var(--proof-surface-hover)",
                }}
              >
                <h2 style={{ fontWeight: 500, fontSize: 13 }}>Recent Executions</h2>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="proof-table" style={{ width: "100%", fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "8px 12px" }}>Run</th>
                      <th style={{ padding: "8px 12px" }}>Date</th>
                      <th style={{ padding: "8px 12px" }}>Status</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Duration</th>
                      <th style={{ padding: "8px 12px" }}>Build</th>
                      <th style={{ padding: "8px 12px" }}>Rev</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        run: "run_892_prod",
                        date: "Today 10:45",
                        status: "FAIL",
                        dur: "185ms",
                        build: "v892",
                        rev: "2341.1.0",
                      },
                      {
                        run: "run_891_prod",
                        date: "Yesterday",
                        status: "FAIL",
                        dur: "192ms",
                        build: "v891",
                        rev: "2341.1.0",
                      },
                      {
                        run: "run_890_prod",
                        date: "Jun 10",
                        status: "PASS",
                        dur: "134ms",
                        build: "v890",
                        rev: "2340.2.1",
                      },
                      {
                        run: "run_889_prod",
                        date: "Jun 9",
                        status: "FAIL",
                        dur: "145ms",
                        build: "v889",
                        rev: "2340.2.1",
                      },
                      {
                        run: "run_888_prod",
                        date: "Jun 8",
                        status: "PASS",
                        dur: "132ms",
                        build: "v888",
                        rev: "2340.2.1",
                      },
                      {
                        run: "run_887_prod",
                        date: "Jun 7",
                        status: "PASS",
                        dur: "138ms",
                        build: "v887",
                        rev: "2340.2.1",
                      },
                      {
                        run: "run_886_prod",
                        date: "Jun 6",
                        status: "PASS",
                        dur: "450ms",
                        build: "v886",
                        rev: "2340.2.1",
                        spike: true,
                      },
                      {
                        run: "run_885_prod",
                        date: "Jun 5",
                        status: "PASS",
                        dur: "135ms",
                        build: "v885",
                        rev: "2340.2.1",
                      },
                    ].map((row, i) => (
                      <tr
                        key={i}
                        style={{
                          cursor: "pointer",
                          background: row.status === "FAIL" ? "var(--proof-red-bg)" : "transparent",
                        }}
                      >
                        <td
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                            color: "var(--proof-blue)",
                          }}
                        >
                          {row.run}
                        </td>
                        <td style={{ fontSize: 11, whiteSpace: "nowrap" }}>{row.date}</td>
                        <td>
                          <StatusBadge status={row.status as "PASS" | "FAIL"} />
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                          }}
                        >
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {(row as any).spike ? (
                            <span
                              style={{
                                background: "#fef08a",
                                color: "#713f12",
                                padding: "1px 4px",
                                borderRadius: 4,
                                fontWeight: 700,
                              }}
                            >
                              {row.dur}
                            </span>
                          ) : (
                            row.dur
                          )}
                        </td>
                        <td style={{ fontSize: 11 }}>{row.build}</td>
                        <td
                          style={{
                            fontSize: 11,
                            fontFamily: "var(--font-mono)",
                            color: "var(--proof-text-secondary)",
                          }}
                        >
                          {row.rev}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="proof-card" style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  padding: "10px 12px",
                  borderBottom: "1px solid var(--proof-grey)",
                  background: "var(--proof-surface-hover)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2 style={{ fontWeight: 500, fontSize: 13 }}>Duration Trend</h2>
                <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
                  Avg: 145ms
                </span>
              </div>
              <div
                style={{
                  padding: "12px 16px",
                  height: 80,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <svg width="100%" height="100%" viewBox="0 0 300 50" preserveAspectRatio="none">
                  <path
                    d="M0,40 L30,42 L60,38 L90,41 L120,40 L150,45 L180,39 L210,10 L240,40 L270,38 L300,42"
                    fill="none"
                    stroke="var(--proof-blue)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="210"
                    cy="10"
                    r="4"
                    fill="var(--proof-yellow)"
                    stroke="white"
                    strokeWidth="1"
                  />
                  <text
                    x="210"
                    y="25"
                    fontSize="10"
                    textAnchor="middle"
                    fill="var(--proof-text-secondary)"
                  >
                    450ms anomaly
                  </text>
                </svg>
              </div>
            </div>

            {/* HTTP Evidence */}
            {(() => {
              const e = latestResult?.evidence;
              if (!e) return null;
              const rows: { label: string; val: string }[] = [];
              rows.push({ label: "Method", val: e.request.method });
              rows.push({ label: "URL", val: e.request.url });
              rows.push({ label: "Status", val: String(e.response.status) });
              const ct = e.response.headers?.["Content-Type"] ?? "";
              if (ct) rows.push({ label: "Content-Type", val: ct });
              const cl = e.response.headers?.["Content-Length"] ?? "";
              if (cl) rows.push({ label: "Size", val: cl + " bytes" });
              const cache = e.response.headers?.["Cache-Control"] ?? "";
              if (cache) rows.push({ label: "Cache", val: cache });
              return (
                <div className="proof-card" style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      padding: "10px 12px",
                      borderBottom: "1px solid var(--proof-grey)",
                      background: "var(--proof-surface-hover)",
                    }}
                  >
                    <h2 style={{ fontWeight: 500, fontSize: 13 }}>HTTP Evidence (latest run)</h2>
                  </div>
                  <div
                    style={{
                      padding: "12px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                      fontSize: 12,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {rows.map((r) => (
                      <div key={r.label} style={{ display: "flex", gap: 8 }}>
                        <span
                          style={{
                            color: "var(--proof-text-secondary)",
                            width: 100,
                            flexShrink: 0,
                          }}
                        >
                          {r.label}
                        </span>
                        <span style={{ color: "var(--proof-text)", wordBreak: "break-all" }}>
                          {r.val}
                        </span>
                      </div>
                    ))}
                  </div>
                  {e.response.headers && Object.keys(e.response.headers).length > 0 && (
                    <details open style={{ margin: "0 16px 12px", fontSize: 12 }}>
                      <summary
                        style={{
                          cursor: "pointer",
                          color: "var(--proof-text-secondary)",
                          fontWeight: 600,
                          fontSize: 10,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Response Headers ({Object.keys(e.response.headers).length})
                      </summary>
                      <div
                        style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}
                      >
                        {Object.entries(e.response.headers).map(([k, v]) => (
                          <div
                            key={k}
                            style={{
                              display: "flex",
                              gap: 6,
                              fontFamily: "var(--font-mono)",
                              fontSize: 11,
                            }}
                          >
                            <span style={{ color: "var(--proof-blue)", minWidth: 160 }}>{k}</span>
                            <span style={{ color: "var(--proof-text)", wordBreak: "break-all" }}>
                              {v}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                  {e.request.headers && Object.keys(e.request.headers).length > 0 && (
                    <details open style={{ margin: "0 16px 12px", fontSize: 12 }}>
                      <summary
                        style={{
                          cursor: "pointer",
                          color: "var(--proof-text-secondary)",
                          fontWeight: 600,
                          fontSize: 10,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Request Headers ({Object.keys(e.request.headers).length})
                      </summary>
                      <div
                        style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}
                      >
                        {Object.entries(e.request.headers).map(([k, v]) => (
                          <div
                            key={k}
                            style={{
                              display: "flex",
                              gap: 6,
                              fontFamily: "var(--font-mono)",
                              fontSize: 11,
                            }}
                          >
                            <span style={{ color: "var(--proof-purple)", minWidth: 160 }}>{k}</span>
                            <span style={{ color: "var(--proof-text)", wordBreak: "break-all" }}>
                              {v}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                  {e.response.cookies && e.response.cookies.length > 0 && (
                    <details open style={{ margin: "0 16px 12px", fontSize: 12 }}>
                      <summary
                        style={{
                          cursor: "pointer",
                          color: "var(--proof-text-secondary)",
                          fontWeight: 600,
                          fontSize: 10,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Cookies ({e.response.cookies.length})
                      </summary>
                      <div
                        style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}
                      >
                        {e.response.cookies.map((c, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              gap: 6,
                              fontFamily: "var(--font-mono)",
                              fontSize: 11,
                              padding: "4px 6px",
                              background: "var(--proof-grey-bg)",
                              borderRadius: 4,
                            }}
                          >
                            <span style={{ color: "var(--proof-orange)", fontWeight: 600 }}>
                              {c.name}
                            </span>
                            <span style={{ color: "var(--proof-text)", wordBreak: "break-all" }}>
                              = {c.value}
                            </span>
                            {c.domain && (
                              <span style={{ color: "var(--proof-text-secondary)" }}>
                                domain={c.domain}
                              </span>
                            )}
                            {c.path && (
                              <span style={{ color: "var(--proof-text-secondary)" }}>
                                path={c.path}
                              </span>
                            )}
                            {c.httpOnly && (
                              <span style={{ color: "var(--proof-green)" }}>HttpOnly</span>
                            )}
                            {c.secure && (
                              <span style={{ color: "var(--proof-green)" }}>Secure</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Right sidebar — changelog */}
          <div style={{ overflowY: "auto", paddingLeft: 4 }}>
            <TestDocChangelog testCase={testCase} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
