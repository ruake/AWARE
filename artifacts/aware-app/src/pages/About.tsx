import React from "react";
import { AppLayout } from "@/components/aware/AppLayout";
import { Link } from "wouter";
import { Zap, BarChart3, GitCompare, Bug, Activity, Shield, Globe, Book, FolderTree, Database, FileCode, Route, ChevronDown } from "lucide-react";
import { RUNS, DIFF_ROWS } from "@/lib/data";

function DocSection({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(defaultOpen ?? false);
  return (
    <div className="gcp-card" style={{ marginBottom: 12, overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "var(--gcp-grey-bg)", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "var(--gcp-text)", textAlign: "left" }}>
        <ChevronDown size={14} style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s", flexShrink: 0 }} />
        {title}
      </button>
      {open && <div style={{ padding: "4px 16px 16px", fontSize: 12, lineHeight: 1.7, color: "var(--gcp-text-secondary)" }}>{children}</div>}
    </div>
  );
}

function DocTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table className="gcp-table" style={{ margin: "8px 0", fontSize: 11 }}>
      <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>
        {rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={{ fontFamily: j === 0 ? "var(--font-mono)" : undefined, fontSize: 11 }}>{c}</td>)}</tr>)}
      </tbody>
    </table>
  );
}

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

  const [showDocs, setShowDocs] = React.useState(false);

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

        {/* Project Documentation toggle */}
        <div style={{ marginBottom: 28 }}>
          <button onClick={() => setShowDocs(!showDocs)} className="gcp-card" style={{ width: "100%", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, border: "none", cursor: "pointer", background: "var(--gcp-blue-bg)", fontSize: 14, fontWeight: 700, color: "var(--gcp-blue)" }}>
            <Book size={18} />
            <span style={{ flex: 1, textAlign: "left" }}>{showDocs ? "Hide Project Documentation" : "📖 View Project Documentation — how this app works"}</span>
            <ChevronDown size={16} style={{ transform: showDocs ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
          </button>

          {showDocs && (
            <div style={{ marginTop: 16 }}>

              {/* Architecture */}
              <DocSection title="🏗️ 1. Architecture — How Files Are Organized" defaultOpen>
                <p>The app lives in <code style={{ fontSize: 11, background: "var(--gcp-grey-bg)", padding: "1px 5px", borderRadius: 3 }}>artifacts/aware-app/src/</code>. Everything is split into three folders:</p>
                <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
                  <li><strong><code>lib/</code></strong> — data layer: types, store, seed data, helpers</li>
                  <li><strong><code>pages/</code></strong> — one file per route (Dashboard, Runs, Compare, etc.)</li>
                  <li><strong><code>components/</code></strong> — reusable UI pieces: <code>aware/</code> for app-specific, <code>ui/</code> for shadcn</li>
                </ul>
                <p><strong>Core rule:</strong> Pages import from <code>@/lib/data</code> (a barrel file). Never import directly from <code>lib/</code> sub-modules.</p>
              </DocSection>

              {/* Data Architecture */}
              <DocSection title="🗄️ 2. Data Architecture — Where Data Lives">
                <p><strong>All data is in-memory + localStorage.</strong> There is no backend — data resets when you clear browser storage.</p>
                <DocTable
                  headers={["File", "What it stores"]}
                  rows={[
                    ["lib/runs.ts", "12 seed runs + 15 diff rows + test results"],
                    ["lib/testCases.ts", "25 seed test cases with predicates, HTTP config, changelog"],
                    ["lib/testSuites.ts", "8 seed suites organized in a tree"],
                    ["lib/store.ts", "CRUD functions: createTestCase, updateTestCase, deleteTestCase, etc."],
                    ["lib/promotions.ts", "Promotion decisions saved per run"],
                    ["lib/constants.ts", "ENVS, TEST_NAMES, CATEGORIES, TAGS, etc."],
                    ["lib/types.ts", "All TypeScript interfaces (Run, TestCase, DiffRow, etc.)"],
                  ]}
                />
                <p><strong>How it works:</strong> When you add/edit/delete a test case, the store saves to localStorage under keys <code>aware_test_cases_v2</code> and <code>aware_test_suites_v2</code>. It also notifies subscribers so the UI updates automatically.</p>
              </DocSection>

              {/* Routes */}
              <DocSection title="🧭 3. Routes — Every Page in the App">
                <p>Routes are defined in <code style={{ fontSize: 11, background: "var(--gcp-grey-bg)", padding: "1px 5px", borderRadius: 3 }}>App.tsx</code> using <strong>wouter</strong> (not React Router).</p>
                <DocTable
                  headers={["Path", "Page", "What it does"]}
                  rows={[
                    ["/", "Dashboard", "Multi-env charts, alerts, promotion status"],
                    ["/runs", "Runs", "Filterable run table with detail links"],
                    ["/runs/:runId", "RunDetail", "Test results + evidence side panel"],
                    ["/compare", "Compare", "Baseline vs candidate diff table"],
                    ["/tests", "TestManager", "CRUD test cases, bulk actions, import/export"],
                    ["/suites", "TestSuiteManager", "Suite tree + editor + YAML export"],
                    ["/analytics", "TestAnalytics", "Per-test pass rate charts & flakiness"],
                    ["/copilot", "Copilot", "AI assistant — full-page chat with skills"],
                    ["/start", "StartRun", "New run form + command preview"],
                    ["/sharing", "Sharing", "Permalink/share page"],
                    ["/ci-pipeline", "CI Pipeline", "GitHub Actions integration and architecture"],
                    ["/testdoc", "TestDoc", "Per-test documentation (3-column layout)"],
                    ["/about", "About", "Project info + this documentation"],
                  ]}
                />
              </DocSection>

              {/* How to add a page */}
              <DocSection title="📝 4. How to Add a New Page">
                <ol style={{ paddingLeft: 18, margin: "8px 0" }}>
                  <li>Create a file in <code>pages/</code> (e.g. <code>MyNewPage.tsx</code>)</li>
                  <li>Import <code>AppLayout</code> from <code>@/components/aware/AppLayout</code></li>
                  <li>Wrap your content in <code>&lt;AppLayout activeHref="/my-path"&gt;</code></li>
                  <li>Add a route in <code>App.tsx</code>: <code>{'<Route path="/my-path" component={MyNewPage} />'}</code></li>
                  <li>Add a nav item in <code>AppLayout.tsx</code> (the <code>NAV_ITEMS</code> array)</li>
                </ol>
              </DocSection>

              {/* How data flows */}
              <DocSection title="🔄 5. How Data Flows">
                <p><strong>Page → lib/data → store → localStorage</strong></p>
                <p>Every page calls functions from <code>@/lib/data</code> to read or write data. For example:</p>
                <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
                  <li><code>getTestCases()</code> — returns all test cases from the store</li>
                  <li><code>createTestCase(data)</code> — adds a new test case, saves to localStorage</li>
                  <li><code>getTestResultsForRun(runId)</code> — generates mock test results for a run</li>
                  <li><code>getRunById(id)</code> — looks up a single run</li>
                </ul>
                <p>When data changes, the store calls <code>_notify()</code> which triggers listeners, so any component using <code>useTestData()</code> re-renders automatically.</p>
              </DocSection>

              {/* Key design decisions */}
              <DocSection title="🎨 6. Design Rules — Know Before You Code">
                <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
                  <li><strong>All pages use inline <code>{'style={{}}'}</code></strong> — NOT Tailwind classes. CSS variables like <code>var(--gcp-blue)</code> are defined in <code>_group.css</code>.</li>
                  <li><strong>No Playwright test scripts.</strong> All <code>scriptPath</code> fields use <code>.yaml</code> extension for portable YAML schemas.</li>
                  <li><strong>Mock data lives in <code>lib/</code> modules.</strong> Replace <code>RUNS</code>, <code>DIFF_ROWS</code>, <code>getTestCases()</code> etc. with real API calls when ready.</li>
                  <li><strong>Navigation:</strong> Use wouter's <code>useLocation()</code> for SPA navigation. <code>navTo()</code> does a full page reload.</li>
                  <li><strong>Charts use Recharts.</strong> Not Google Charts.</li>
                  <li><strong>shadcn UI</strong> components live in <code>components/ui/</code> with <code>class-variance-authority</code>.</li>
                  <li><strong>Typecheck must pass</strong> before committing: <code>pnpm run typecheck</code>.</li>
                </ul>
              </DocSection>

              {/* Available data */}
              <DocSection title="📊 7. Current Seed Data">
                <p>The app ships with realistic seed data so you can explore without setting up a backend:</p>
                <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
                  <li><strong>Runs:</strong> {RUNS.length} runs across Prod/Production, Prod/Staging, UAT/Production, UAT/Staging</li>
                  <li><strong>Diff rows:</strong> {DIFF_ROWS.length} comparison results (regressions, fixed, duration, unchanged)</li>
                  <li><strong>Test cases:</strong> 25 seed cases with categories, priorities, severity, tags</li>
                  <li><strong>Suites:</strong> 8 suites with tree hierarchy and integration configs</li>
                  <li><strong>Environments:</strong> 4 env targets × 2 networks = 8 env combinations</li>
                </ul>
              </DocSection>

              {/* LLM/AI */}
              <DocSection title="🤖 8. AI Copilot — How the LLM Works">
                <p>The Copilot page at <code>/copilot</code> provides an AI chat with 3 providers:</p>
                <ul style={{ paddingLeft: 18, margin: "8px 0" }}>
                  <li><strong>Mock</strong> — works offline, returns canned responses. No API key needed.</li>
                  <li><strong>OpenAI</strong> — connects to any OpenAI-compatible API. Requires API Key.</li>
                  <li><strong>WebLLM</strong> — runs a model in-browser via WebGPU. Shows an unavailable message if your browser doesn't support it.</li>
                </ul>
                <p>Switch providers in the config panel on the Copilot page. The app has 5 built-in skills (generate tests, generate scripts, analyze results, explain diffs, generate suites).</p>
              </DocSection>

            </div>
          )}
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
