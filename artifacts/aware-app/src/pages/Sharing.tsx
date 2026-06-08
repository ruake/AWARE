import React from "react";
import { AppLayout } from "@/components/aware/AppLayout";
import { copyToClipboard } from "@/lib/nav";
import "../_group.css";
import {
  Link2, Copy, Check, Github, Code2,
  PlayCircle, Hash, GitCompare, FileText,
  Shield, Share2, AlertTriangle, CheckCircle2,
} from "lucide-react";

type EntityKind = "run" | "test" | "comparison" | "testdoc";

const BASE = "https://proof.example.com";

const ENTITIES = {
  run: {
    label: "Run", icon: PlayCircle,
    id: "run_892_2341.1.0_prod_1001", status: "FAIL", statusColor: "var(--gcp-red)",
    title: "Prod/Production · Build v892 · Rev 2341.1.0",
    meta: "45m · 2 failures · 2026-06-06",
    url: `${BASE}/runs/run_892_2341.1.0_prod_1001`,
    short: `${BASE}/r/xQ9kL2`,
  },
  test: {
    label: "Test", icon: Hash,
    id: "test_geo_match_us_locale_prod[/us/]", status: "FAIL", statusColor: "var(--gcp-red)",
    title: "test_geo_match_us_locale_prod[/us/]",
    meta: "geo-match · full_suite · 94.8% pass rate",
    url: `${BASE}/tests/test_geo_match_us_locale_prod`,
    short: `${BASE}/t/mR3wP8`,
  },
  comparison: {
    label: "Comparison", icon: GitCompare,
    id: "cmp_892_vs_891_prod", status: "REGRESSION", statusColor: "var(--gcp-red)",
    title: "Build v892 vs Build v891 — Prod/Production",
    meta: "+7 regressions · +12 fixed · 3d ago",
    url: `${BASE}/compare/run_892..run_891`,
    short: `${BASE}/c/nT7vK1`,
  },
  testdoc: {
    label: "Test Doc", icon: FileText,
    id: "test_geo_match_us_locale_prod", status: "FLAKY", statusColor: "var(--gcp-yellow)",
    title: "Test Documentation — test_geo_match_us_locale_prod",
    meta: "5.3% flake rate · last updated Jun 5",
    url: `${BASE}/docs/test_geo_match_us_locale_prod`,
    short: `${BASE}/d/kW2xJ4`,
  },
} as const;

const BADGES = [
  { target: "Prod/Production", pass: 87, status: "degraded", color: "#d93025" },
  { target: "Prod/Staging", pass: 92, status: "warning", color: "#f9ab00" },
  { target: "UAT/Production", pass: 100, status: "healthy", color: "#1e8e3e" },
  { target: "UAT/Staging", pass: 98, status: "healthy", color: "#1e8e3e" },
];

function CopyBtn({ id, text, onClick }: { id: string; text: string; onClick: (key: string, text: string) => void }) {
  const [copied, setCopied] = React.useState(false);
  const handle = () => { onClick(id, text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={handle} className="gcp-button gcp-button-xs" style={{ color: copied ? "var(--gcp-green)" : "var(--gcp-blue)", flexShrink: 0 }}>
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function Sharing() {
  const [kind, setKind] = React.useState<EntityKind>("run");
  const [activeBadge, setActiveBadge] = React.useState(0);
  const e = ENTITIES[kind];

  const copy = (key: string, text: string) => {
    copyToClipboard(text);
  };

  const slackMsg = `*[PROOF]* ${e.status} detected on \`${e.id}\`\n> ${e.title}\n> ${e.meta}\n\n:link: <${e.url}|View in PROOF>`;

  const githubBody = `## PROOF Regression Report\n\n**Entity:** \`${e.id}\`\n**Status:** ${e.status}\n**Context:** ${e.title}\n**Detail:** ${e.meta}\n\n\`\`\`bash\nopen "${e.url}"\n\`\`\``;

  const emailBody = `${e.title}\n\nStatus: ${e.status}\nDetail: ${e.meta}\n\nView in PROOF: ${e.url}`;

  const badge = BADGES[activeBadge];

  const kindIcon = (k: EntityKind) => {
    const Icon = ENTITIES[k].icon;
    return <Icon size={13} />;
  };

  return (
    <AppLayout activeHref="/share">
      <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 500 }}>Sharing & Permalinks</h1>
            <p style={{ fontSize: 13, color: "var(--gcp-text-secondary)", marginTop: 2 }}>Deep links, export formats, and embeddable badges</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--gcp-text-secondary)", background: "var(--gcp-grey-bg)", padding: "6px 12px", borderRadius: 4, border: "1px solid var(--gcp-grey)" }}>
            <Shield size={12} /> All links include a read-only token valid for 30 days
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {(Object.keys(ENTITIES) as EntityKind[]).map(k => {
            const Icon = ENTITIES[k].icon;
            const isActive = kind === k;
            return (
              <button key={k} onClick={() => setKind(k)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 4, fontSize: 13, fontWeight: 500, border: isActive ? "none" : "1px solid var(--gcp-grey)", background: isActive ? "var(--gcp-blue)" : "var(--gcp-surface)", color: isActive ? "white" : "var(--gcp-text-secondary)", cursor: "pointer", transition: "all 0.15s" }}>
                <Icon size={13} /> {ENTITIES[k].label}
              </button>
            );
          })}
        </div>

        <div className="gcp-card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 16, background: "var(--gcp-grey-bg)" }}>
          {kindIcon(kind)}
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 500 }}>{e.id}</span>
          <span className="gcp-badge" style={{ fontSize: 11, backgroundColor: e.statusColor + "22", color: e.statusColor }}>{e.status}</span>
          <span style={{ fontSize: 12, color: "var(--gcp-text-secondary)" }}>{e.title}</span>
          <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)", marginLeft: "auto" }}>{e.meta}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          <div className="gcp-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ fontSize: 12, fontWeight: 500, color: "var(--gcp-text-secondary)", textTransform: "uppercase", borderBottom: "1px solid var(--gcp-grey)", paddingBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Link2 size={12} /> Permalink
            </h2>
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--gcp-text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>Full URL</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--gcp-grey-bg)", border: "1px solid var(--gcp-grey)", borderRadius: 4, padding: "8px 10px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.url}</span>
                <CopyBtn id="full" text={e.url} onClick={copy} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--gcp-text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>Short URL</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--gcp-grey-bg)", border: "1px solid var(--gcp-grey)", borderRadius: 4, padding: "8px 10px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gcp-blue)", flex: 1 }}>{e.short}</span>
                <CopyBtn id="short" text={e.short} onClick={copy} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--gcp-text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>Deep Links</div>
              {[{ label: "Evidence panel", path: "/evidence" }, { label: "Raw JSON", path: "/json" }, { label: "Timeline view", path: "/timeline" }].map(dl => (
                <div key={dl.path} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--gcp-grey)" }}>
                  <span style={{ fontSize: 12 }}>{dl.label}</span>
                  <CopyBtn id={`dl-${dl.path}`} text={e.url + dl.path} onClick={copy} />
                </div>
              ))}
            </div>
          </div>

          <div className="gcp-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ fontSize: 12, fontWeight: 500, color: "var(--gcp-text-secondary)", textTransform: "uppercase", borderBottom: "1px solid var(--gcp-grey)", paddingBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Share2 size={12} /> Export
            </h2>
            {[
              { label: "Slack Message", icon: "💬", content: slackMsg },
              { label: "GitHub Issue", icon: <Github size={13} />, content: githubBody },
              { label: "Email Body", icon: "📧", content: emailBody },
            ].map(fmt => (
              <div key={fmt.label}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 500, color: "var(--gcp-text-secondary)" }}>
                    {fmt.icon} {fmt.label}
                  </div>
                  <CopyBtn id={`fmt-${fmt.label}`} text={fmt.content} onClick={copy} />
                </div>
                <pre style={{ fontSize: 11, lineHeight: 1.4, padding: 10, borderRadius: 4, border: "1px solid var(--gcp-grey)", background: "var(--gcp-grey-bg)", whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", maxHeight: 120, overflow: "auto", margin: 0 }}>
                  {fmt.content}
                </pre>
              </div>
            ))}
          </div>

          <div className="gcp-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ fontSize: 12, fontWeight: 500, color: "var(--gcp-text-secondary)", textTransform: "uppercase", borderBottom: "1px solid var(--gcp-grey)", paddingBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Code2 size={12} /> Embed / Badge
            </h2>
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--gcp-text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>Status Badge</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                {BADGES.map((b, i) => (
                  <button key={b.target} onClick={() => setActiveBadge(i)}
                    style={{ padding: "4px 10px", borderRadius: 4, fontSize: 11, border: i === activeBadge ? `2px solid ${b.color}` : "1px solid var(--gcp-grey)", background: "var(--gcp-surface)", color: "var(--gcp-text)", cursor: "pointer", fontWeight: i === activeBadge ? 700 : 400 }}>
                    {b.target} · {b.pass}%
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--gcp-grey-bg)", border: "1px solid var(--gcp-grey)", borderRadius: 4, padding: "8px 10px", marginBottom: 8 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {`[![PROOF ${badge.target}](${BASE}/badges/${badge.target.toLowerCase().replace(/\//g, "-").replace(/\s/g, "")}.svg)](${BASE})`}
                </span>
                <CopyBtn id="badge-md" text={`[![PROOF ${badge.target}](${BASE}/badges/${badge.target.toLowerCase().replace(/\//g, "-").replace(/\s/g, "")}.svg)](${BASE})`} onClick={copy} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--gcp-text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>HTML Embed</div>
              <pre style={{ fontSize: 11, lineHeight: 1.4, padding: 10, borderRadius: 4, border: "1px solid var(--gcp-grey)", background: "var(--gcp-grey-bg)", whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", maxHeight: 80, overflow: "auto", margin: 0 }}>
                {`<img src="${BASE}/badges/${badge.target.toLowerCase().replace(/\//g, "-").replace(/\s/g, "")}.svg" alt="PROOF ${badge.target}" />`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
