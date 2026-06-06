import React from "react";
import {
  Globe, MousePointer, Zap, Server, Radio, GitBranch,
  HardDrive, Mail, Cable, Lock, Activity, Network,
  Play, Cloud, Monitor, Wifi, Plus, Trash2, ChevronRight,
  ChevronLeft, Check, X, Upload, Download, Copy, AlertCircle,
  FileJson, FileText, Code2, Info,
} from "lucide-react";
import type { TestCase, CatchpointTestType, TestAssertion, TransactionStep, TestConfig } from "@/lib/types";
import { exportAsJSON, exportAsYAML, exportAsXML, importAuto, type ImportResult } from "@/lib/testImportExport";

// ── Catchpoint test type definitions ──────────────────────────────────────

export const TEST_TYPES: {
  id: CatchpointTestType; label: string; icon: React.ElementType;
  desc: string; color: string; category: string;
}[] = [
  { id: "web",         label: "Web",         icon: Globe,        desc: "HTTP/HTTPS page load & performance",     color: "#4285f4", category: "url-health" },
  { id: "transaction", label: "Transaction",  icon: MousePointer, desc: "Multi-step browser user flows",          color: "#34a853", category: "routing" },
  { id: "api",         label: "API",          icon: Zap,          desc: "REST / SOAP API endpoint testing",       color: "#fbbc04", category: "url-health" },
  { id: "dns",         label: "DNS",          icon: Server,       desc: "DNS resolution & propagation checks",    color: "#ea4335", category: "routing" },
  { id: "ping",        label: "Ping",         icon: Radio,        desc: "ICMP connectivity & latency",            color: "#9c27b0", category: "performance" },
  { id: "traceroute",  label: "Traceroute",   icon: GitBranch,    desc: "Network path & hop-by-hop analysis",     color: "#00bcd4", category: "performance" },
  { id: "ftp",         label: "FTP",          icon: HardDrive,    desc: "FTP / SFTP file transfer validation",    color: "#795548", category: "routing" },
  { id: "smtp",        label: "SMTP",         icon: Mail,         desc: "Email delivery & relay testing",         color: "#ff5722", category: "security" },
  { id: "tcp",         label: "TCP",          icon: Cable,        desc: "Raw TCP port connectivity checks",       color: "#607d8b", category: "routing" },
  { id: "ssl",         label: "SSL/TLS",      icon: Lock,         desc: "Certificate validity, chain & expiry",  color: "#4caf50", category: "tls" },
  { id: "websocket",   label: "WebSocket",    icon: Activity,     desc: "WebSocket handshake & message round-trip", color: "#ff9800", category: "url-health" },
  { id: "bgp",         label: "BGP",          icon: Network,      desc: "BGP routing & prefix monitoring",        color: "#3f51b5", category: "routing" },
  { id: "streaming",   label: "Streaming",    icon: Play,         desc: "HLS / DASH / RTMP media quality",        color: "#e91e63", category: "performance" },
  { id: "cdn",         label: "CDN",          icon: Cloud,        desc: "CDN cache, edge & PoP validation",       color: "#00acc1", category: "geo-match" },
  { id: "playwright",  label: "Playwright",   icon: Monitor,      desc: "Chromium / Firefox browser automation",  color: "#2e7d32", category: "routing" },
  { id: "network",     label: "Network",      icon: Wifi,         desc: "Broadband quality & packet loss",        color: "#6d4c41", category: "performance" },
];

// ── Assertion field catalog ────────────────────────────────────────────────

const ASSERTION_FIELDS: Record<CatchpointTestType, { value: string; label: string; units?: string[] }[]> = {
  web:         [{ value: "responseTime", label: "Response Time", units: ["ms", "s"] }, { value: "statusCode", label: "Status Code" }, { value: "bodyContains", label: "Body Contains" }, { value: "bodyNotContains", label: "Body Not Contains" }, { value: "headerExists", label: "Header Exists" }, { value: "headerValue", label: "Header Value" }, { value: "contentSize", label: "Content Size", units: ["bytes", "KB", "MB"] }, { value: "availability", label: "Availability %", units: ["%"] }],
  api:         [{ value: "responseTime", label: "Response Time", units: ["ms", "s"] }, { value: "statusCode", label: "Status Code" }, { value: "jsonPath", label: "JSON Path" }, { value: "bodyContains", label: "Body Contains" }, { value: "headerExists", label: "Header Exists" }, { value: "headerValue", label: "Header Value" }, { value: "contentType", label: "Content-Type" }, { value: "availability", label: "Availability %", units: ["%"] }],
  transaction: [{ value: "stepTime", label: "Step Time", units: ["ms", "s"] }, { value: "totalTime", label: "Total Duration", units: ["ms", "s"] }, { value: "elementVisible", label: "Element Visible" }, { value: "elementText", label: "Element Text" }, { value: "urlReached", label: "URL Reached" }, { value: "errorCount", label: "Error Count" }],
  dns:         [{ value: "resolveTime", label: "Resolve Time", units: ["ms"] }, { value: "recordValue", label: "Record Value" }, { value: "recordCount", label: "Record Count" }, { value: "ttl", label: "TTL", units: ["s"] }, { value: "nameserver", label: "Nameserver" }],
  ping:        [{ value: "packetLoss", label: "Packet Loss", units: ["%"] }, { value: "rtt", label: "Round-Trip Time", units: ["ms"] }, { value: "minRtt", label: "Min RTT", units: ["ms"] }, { value: "maxRtt", label: "Max RTT", units: ["ms"] }, { value: "jitter", label: "Jitter", units: ["ms"] }],
  traceroute:  [{ value: "hopCount", label: "Hop Count" }, { value: "totalTime", label: "Total Time", units: ["ms"] }, { value: "hopExists", label: "Hop Exists" }, { value: "hopTime", label: "Hop Time", units: ["ms"] }, { value: "lastHop", label: "Last Hop IP" }],
  ftp:         [{ value: "connectTime", label: "Connect Time", units: ["ms"] }, { value: "transferTime", label: "Transfer Time", units: ["ms", "s"] }, { value: "transferSpeed", label: "Transfer Speed", units: ["KB/s", "MB/s"] }, { value: "fileSize", label: "File Size", units: ["bytes", "KB"] }, { value: "statusCode", label: "FTP Status Code" }],
  smtp:        [{ value: "connectTime", label: "Connect Time", units: ["ms"] }, { value: "deliveryTime", label: "Delivery Time", units: ["ms", "s"] }, { value: "bannerContains", label: "Banner Contains" }, { value: "authSuccess", label: "Auth Success" }, { value: "availability", label: "Availability %", units: ["%"] }],
  tcp:         [{ value: "connectTime", label: "Connect Time", units: ["ms"] }, { value: "availability", label: "Availability %", units: ["%"] }, { value: "responseContains", label: "Response Contains" }, { value: "packetLoss", label: "Packet Loss", units: ["%"] }],
  ssl:         [{ value: "daysToExpiry", label: "Days to Expiry", units: ["days"] }, { value: "issuer", label: "Issuer" }, { value: "subject", label: "Subject (CN)" }, { value: "chainValid", label: "Chain Valid" }, { value: "tlsVersion", label: "TLS Version" }, { value: "ocspStatus", label: "OCSP Status" }],
  websocket:   [{ value: "handshakeTime", label: "Handshake Time", units: ["ms"] }, { value: "messageRtt", label: "Message RTT", units: ["ms"] }, { value: "responseContains", label: "Response Contains" }, { value: "availability", label: "Availability %", units: ["%"] }],
  bgp:         [{ value: "prefixExists", label: "Prefix Announced" }, { value: "asnPath", label: "AS Path Contains" }, { value: "community", label: "Community Tag" }, { value: "originAs", label: "Origin AS" }, { value: "withdrawalDetected", label: "Withdrawal Detected" }],
  streaming:   [{ value: "startupTime", label: "Startup Time", units: ["ms", "s"] }, { value: "bufferingRatio", label: "Buffering Ratio", units: ["%"] }, { value: "bitrate", label: "Bitrate", units: ["kbps", "Mbps"] }, { value: "availability", label: "Availability %", units: ["%"] }, { value: "errorRate", label: "Error Rate", units: ["%"] }],
  cdn:         [{ value: "responseTime", label: "Response Time", units: ["ms"] }, { value: "cacheHit", label: "Cache Hit" }, { value: "edgeLocation", label: "Edge Location" }, { value: "cacheHeader", label: "Cache Header" }, { value: "statusCode", label: "Status Code" }, { value: "ttfb", label: "TTFB", units: ["ms"] }],
  playwright:  [{ value: "stepSuccess", label: "Step Success" }, { value: "elementVisible", label: "Element Visible" }, { value: "elementText", label: "Element Text" }, { value: "urlReached", label: "URL Reached" }, { value: "networkRequest", label: "Network Request" }, { value: "totalTime", label: "Total Duration", units: ["ms", "s"] }],
  network:     [{ value: "bandwidth", label: "Bandwidth", units: ["Mbps", "Kbps"] }, { value: "latency", label: "Latency", units: ["ms"] }, { value: "packetLoss", label: "Packet Loss", units: ["%"] }, { value: "jitter", label: "Jitter", units: ["ms"] }, { value: "availability", label: "Availability %", units: ["%"] }],
};

const OPERATORS = [
  { value: "=",            label: "=" },
  { value: "!=",           label: "≠" },
  { value: "<",            label: "<" },
  { value: "<=",           label: "≤" },
  { value: ">",            label: ">" },
  { value: ">=",           label: "≥" },
  { value: "contains",     label: "contains" },
  { value: "not_contains", label: "not contains" },
  { value: "exists",       label: "exists" },
  { value: "not_exists",   label: "not exists" },
  { value: "matches",      label: "matches (regex)" },
];

// ── Form state ─────────────────────────────────────────────────────────────

function genId() { return Math.random().toString(36).slice(2, 10); }

const CATEGORIES = ["geo-match", "locale-split", "url-health", "security", "performance", "caching", "routing", "tls", "ddos"];
const PRIORITIES: TestCase["priority"][] = ["P0", "P1", "P2", "P3"];
const OWNERS = ["alice@co.com", "bob@co.com", "carol@co.com", "dave@co.com", "eve@co.com"];

type WizardForm = {
  name: string; description: string; testType: CatchpointTestType;
  category: string; priority: TestCase["priority"]; owner: string;
  status: TestCase["status"]; tags: string; preconditions: string;
  expectedBehavior: string; scriptPath: string;
  config: TestConfig; assertions: TestAssertion[];
};

function blankForm(tc?: TestCase): WizardForm {
  return {
    name: tc?.name ?? "",
    description: tc?.description ?? "",
    testType: tc?.testType ?? "web",
    category: tc?.category ?? "url-health",
    priority: tc?.priority ?? "P2",
    owner: tc?.owner ?? OWNERS[0],
    status: tc?.status ?? "active",
    tags: tc?.tags?.join(", ") ?? "",
    preconditions: tc?.preconditions ?? "",
    expectedBehavior: tc?.expectedBehavior ?? "",
    scriptPath: tc?.scriptPath ?? "",
    config: tc?.config ?? {},
    assertions: tc?.assertions ?? [],
  };
}

function formToTestCase(form: WizardForm, existing?: TestCase): Partial<TestCase> {
  const now = new Date().toISOString();
  return {
    name: form.name.trim(),
    description: form.description,
    testType: form.testType,
    category: form.category,
    priority: form.priority,
    owner: form.owner,
    status: form.status,
    tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
    preconditions: form.preconditions,
    expectedBehavior: form.expectedBehavior,
    scriptPath: form.scriptPath || `tests/aware/${form.testType}/tc_${genId()}.spec.ts`,
    config: form.config,
    assertions: form.assertions,
    severity: existing?.severity ?? "minor",
    automated: true,
    suiteIds: existing?.suiteIds ?? [],
    documentation: existing?.documentation ?? "",
    relatedTestIds: existing?.relatedTestIds ?? [],
    version: (existing?.version ?? 0) + 1,
    changelog: existing?.changelog ?? [],
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
      {children}
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, style }: { value: string; onChange: (v: string) => void; placeholder?: string; style?: React.CSSProperties }) {
  return <input className="gcp-input" style={{ width: "100%", ...style }} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />;
}

function Textarea({ value, onChange, rows = 3, mono }: { value: string; onChange: (v: string) => void; rows?: number; mono?: boolean }) {
  return <textarea className="gcp-input" style={{ width: "100%", height: rows * 22 + 10, resize: "vertical", fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)", fontSize: mono ? 11 : 13 }} value={value} onChange={e => onChange(e.target.value)} />;
}

function Select({ value, onChange, children, style }: { value: string; onChange: (v: string) => void; children: React.ReactNode; style?: React.CSSProperties }) {
  return <select className="gcp-input" style={{ width: "100%", ...style }} value={value} onChange={e => onChange(e.target.value)}>{children}</select>;
}

function NumInput({ value, onChange, placeholder, min, max }: { value: number | undefined; onChange: (v: number | undefined) => void; placeholder?: string; min?: number; max?: number }) {
  return <input type="number" className="gcp-input" style={{ width: "100%" }} value={value ?? ""} min={min} max={max} placeholder={placeholder} onChange={e => onChange(e.target.value === "" ? undefined : Number(e.target.value))} />;
}

// ── Step 1 — Type Selection ────────────────────────────────────────────────

function StepTypeSelect({ form, setForm }: { form: WizardForm; setForm: React.Dispatch<React.SetStateAction<WizardForm>> }) {
  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--gcp-text-secondary)", marginBottom: 14 }}>
        Select the Catchpoint-compatible test type. Each type unlocks its own configuration fields and assertion catalog.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
        {TEST_TYPES.map(t => {
          const Icon = t.icon;
          const selected = form.testType === t.id;
          return (
            <button key={t.id} onClick={() => setForm(f => ({ ...f, testType: t.id, category: t.category }))}
              style={{ border: `2px solid ${selected ? t.color : "var(--gcp-grey)"}`, borderRadius: 6, padding: "10px 12px", background: selected ? `${t.color}14` : "var(--gcp-surface)", cursor: "pointer", textAlign: "left", transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 6 }}
            >
              <Icon size={18} style={{ color: t.color }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gcp-text)" }}>{t.label}</div>
              <div style={{ fontSize: 10, color: "var(--gcp-text-secondary)", lineHeight: 1.4 }}>{t.desc}</div>
              {selected && <div style={{ fontSize: 10, fontWeight: 700, color: t.color }}>✓ Selected</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 2 — Basic Info ────────────────────────────────────────────────────

function StepBasicInfo({ form, setForm }: { form: WizardForm; setForm: React.Dispatch<React.SetStateAction<WizardForm>> }) {
  const f = (k: keyof WizardForm) => (v: string) => setForm(prev => ({ ...prev, [k]: v }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Field label="Test Name *">
        <Input value={form.name} onChange={f("name")} placeholder="e.g. Verify Geo match for /api/v1/data resolves correct PoP" />
      </Field>
      <Field label="Description">
        <Textarea value={form.description} onChange={f("description")} rows={3} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Category">
          <Select value={form.category} onChange={f("category")}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Priority">
          <Select value={form.priority} onChange={v => setForm(p => ({ ...p, priority: v as TestCase["priority"] }))}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p} {p === "P0" ? "— Critical" : p === "P1" ? "— High" : p === "P2" ? "— Medium" : "— Low"}</option>)}
          </Select>
        </Field>
        <Field label="Owner">
          <Select value={form.owner} onChange={f("owner")}>
            {OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={v => setForm(p => ({ ...p, status: v as TestCase["status"] }))}>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
            <option value="deprecated">Deprecated</option>
          </Select>
        </Field>
      </div>
      <Field label="Tags (comma-separated)">
        <Input value={form.tags} onChange={f("tags")} placeholder="cdn, regression, geo, smoke" />
      </Field>
      <Field label="Script Path">
        <Input value={form.scriptPath} onChange={f("scriptPath")} placeholder="tests/aware/cdn/tc_geo_match.spec.ts" />
      </Field>
      <Field label="Preconditions">
        <Textarea value={form.preconditions} onChange={f("preconditions")} rows={2} />
      </Field>
      <Field label="Expected Behavior">
        <Textarea value={form.expectedBehavior} onChange={f("expectedBehavior")} rows={2} />
      </Field>
    </div>
  );
}

// ── Step 3 — Configuration (type-specific) ─────────────────────────────────

function ConfigField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function HeadersEditor({ headers, onChange }: { headers: { key: string; value: string }[]; onChange: (h: { key: string; value: string }[]) => void }) {
  const rows = headers.length === 0 ? [{ key: "", value: "" }] : headers;
  const update = (i: number, field: "key" | "value", val: string) => {
    const next = rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r);
    onChange(next.filter(r => r.key || r.value));
  };
  const add = () => onChange([...rows, { key: "", value: "" }]);
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  return (
    <div style={{ border: "1px solid var(--gcp-grey)", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 28px", padding: "4px 8px", background: "var(--gcp-grey-bg)", fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase" }}>
        <span>Key</span><span>Value</span><span />
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 28px", gap: 0, borderTop: "1px solid var(--gcp-grey)" }}>
          <input className="gcp-input" style={{ borderRadius: 0, border: "none", borderRight: "1px solid var(--gcp-grey)", fontSize: 12 }} value={r.key} onChange={e => update(i, "key", e.target.value)} placeholder="Header-Name" />
          <input className="gcp-input" style={{ borderRadius: 0, border: "none", fontSize: 12 }} value={r.value} onChange={e => update(i, "value", e.target.value)} placeholder="value" />
          <button onClick={() => remove(i)} style={{ border: "none", borderLeft: "1px solid var(--gcp-grey)", background: "transparent", cursor: "pointer", color: "var(--gcp-red)" }}><X size={12} /></button>
        </div>
      ))}
      <button onClick={add} style={{ width: "100%", padding: "5px 8px", border: "none", borderTop: "1px solid var(--gcp-grey)", background: "var(--gcp-grey-bg)", cursor: "pointer", color: "var(--gcp-blue)", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
        <Plus size={11} /> Add Header
      </button>
    </div>
  );
}

function StepsEditor({ steps, onChange }: { steps: TransactionStep[]; onChange: (s: TransactionStep[]) => void }) {
  const ACTIONS = ["navigate", "click", "type", "wait", "assert", "screenshot", "scroll"] as const;
  const add = () => onChange([...steps, { id: genId(), action: "navigate", selector: "", value: "", description: "" }]);
  const remove = (i: number) => onChange(steps.filter((_, idx) => idx !== i));
  const update = (i: number, k: keyof TransactionStep, v: string) => onChange(steps.map((s, idx) => idx === i ? { ...s, [k]: v } : s));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {steps.map((s, i) => (
        <div key={s.id} style={{ border: "1px solid var(--gcp-grey)", borderRadius: 4, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6, background: "var(--gcp-surface)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-blue)", minWidth: 18 }}>#{i + 1}</span>
            <select className="gcp-input" style={{ width: 120 }} value={s.action} onChange={e => update(i, "action", e.target.value)}>
              {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <input className="gcp-input" style={{ flex: 1 }} value={s.description ?? ""} onChange={e => update(i, "description", e.target.value)} placeholder="Description" />
            <button onClick={() => remove(i)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--gcp-red)" }}><Trash2 size={13} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <input className="gcp-input" style={{ fontSize: 12 }} value={s.selector ?? ""} onChange={e => update(i, "selector", e.target.value)} placeholder="CSS selector / XPath" />
            <input className="gcp-input" style={{ fontSize: 12 }} value={s.value ?? ""} onChange={e => update(i, "value", e.target.value)} placeholder="Value / URL / text" />
          </div>
        </div>
      ))}
      <button onClick={add} className="gcp-button" style={{ fontSize: 12, alignSelf: "flex-start" }}><Plus size={12} /> Add Step</button>
    </div>
  );
}

function cfg(form: WizardForm, setForm: React.Dispatch<React.SetStateAction<WizardForm>>) {
  const c = form.config;
  const set = (patch: Partial<TestConfig>) => setForm(f => ({ ...f, config: { ...f.config, ...patch } }));
  const setThr = (patch: Partial<NonNullable<TestConfig["thresholds"]>>) =>
    setForm(f => ({ ...f, config: { ...f.config, thresholds: { ...f.config.thresholds, ...patch } } }));
  return { c, set, setThr };
}

function StepConfig({ form, setForm }: { form: WizardForm; setForm: React.Dispatch<React.SetStateAction<WizardForm>> }) {
  const { c, set, setThr } = cfg(form, setForm);
  const t = form.testType;

  const commonHttp = (
    <>
      <ConfigField label="URL *">
        <input className="gcp-input" style={{ width: "100%" }} value={c.url ?? ""} onChange={e => set({ url: e.target.value })} placeholder="https://example.com/api/v1/data" />
      </ConfigField>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <ConfigField label="Method">
          <Select value={c.method ?? "GET"} onChange={v => set({ method: v as TestConfig["method"] })}>
            {["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"].map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
        </ConfigField>
        <ConfigField label="Expected Status">
          <NumInput value={c.expectedStatusCode} onChange={v => set({ expectedStatusCode: v })} placeholder="200" min={100} max={599} />
        </ConfigField>
        <ConfigField label="Timeout (ms)">
          <NumInput value={c.timeoutMs} onChange={v => set({ timeoutMs: v })} placeholder="10000" min={100} />
        </ConfigField>
      </div>
      <ConfigField label="Request Headers">
        <HeadersEditor headers={c.headers ?? []} onChange={h => set({ headers: h })} />
      </ConfigField>
    </>
  );

  const thresholds = (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
      <ConfigField label="Max Response Time (ms)">
        <NumInput value={c.thresholds?.responseTimeMs} onChange={v => setThr({ responseTimeMs: v })} placeholder="2000" min={0} />
      </ConfigField>
      <ConfigField label="Min Availability (%)">
        <NumInput value={c.thresholds?.availabilityPct} onChange={v => setThr({ availabilityPct: v })} placeholder="99.9" min={0} max={100} />
      </ConfigField>
      <ConfigField label="Max Error Rate (%)">
        <NumInput value={c.thresholds?.errorRatePct} onChange={v => setThr({ errorRatePct: v })} placeholder="1" min={0} max={100} />
      </ConfigField>
    </div>
  );

  if (t === "web") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {commonHttp}
      <ConfigField label="Follow Redirects">
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
          <input type="checkbox" checked={c.followRedirects ?? true} onChange={e => set({ followRedirects: e.target.checked })} /> Follow HTTP redirects
        </label>
      </ConfigField>
      {thresholds}
    </div>
  );

  if (t === "api") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {commonHttp}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <ConfigField label="Body Type">
          <Select value={c.bodyType ?? "none"} onChange={v => set({ bodyType: v as TestConfig["bodyType"] })}>
            <option value="none">None</option>
            <option value="json">JSON</option>
            <option value="xml">XML</option>
            <option value="form">Form URL-encoded</option>
            <option value="text">Plain Text</option>
          </Select>
        </ConfigField>
      </div>
      {c.bodyType && c.bodyType !== "none" && (
        <ConfigField label="Request Body">
          <Textarea value={c.body ?? ""} onChange={v => set({ body: v })} rows={5} mono />
        </ConfigField>
      )}
      {thresholds}
    </div>
  );

  if (t === "dns") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <ConfigField label="Hostname *">
          <Input value={c.hostname ?? ""} onChange={v => set({ hostname: v })} placeholder="api.example.com" />
        </ConfigField>
        <ConfigField label="Record Type">
          <Select value={c.recordType ?? "A"} onChange={v => set({ recordType: v as TestConfig["recordType"] })}>
            {["A", "AAAA", "CNAME", "MX", "NS", "TXT", "SOA", "PTR"].map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
        </ConfigField>
        <ConfigField label="Expected Value">
          <Input value={c.expectedValue ?? ""} onChange={v => set({ expectedValue: v })} placeholder="203.0.113.1" />
        </ConfigField>
        <ConfigField label="Nameserver (optional)">
          <Input value={c.nameserver ?? ""} onChange={v => set({ nameserver: v })} placeholder="8.8.8.8" />
        </ConfigField>
        <ConfigField label="Timeout (ms)">
          <NumInput value={c.timeoutMs} onChange={v => set({ timeoutMs: v })} placeholder="5000" min={100} />
        </ConfigField>
      </div>
    </div>
  );

  if (t === "ping") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <ConfigField label="Host *">
          <Input value={c.host ?? ""} onChange={v => set({ host: v })} placeholder="8.8.8.8 or example.com" />
        </ConfigField>
        <ConfigField label="Packet Count">
          <NumInput value={c.packetCount} onChange={v => set({ packetCount: v })} placeholder="10" min={1} max={100} />
        </ConfigField>
        <ConfigField label="Packet Size (bytes)">
          <NumInput value={c.packetSize} onChange={v => set({ packetSize: v })} placeholder="64" min={1} max={65507} />
        </ConfigField>
      </div>
      {thresholds}
    </div>
  );

  if (t === "traceroute") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <ConfigField label="Host *">
          <Input value={c.host ?? ""} onChange={v => set({ host: v })} placeholder="example.com" />
        </ConfigField>
        <ConfigField label="Max Hops">
          <NumInput value={c.maxHops} onChange={v => set({ maxHops: v })} placeholder="30" min={1} max={255} />
        </ConfigField>
        <ConfigField label="Protocol">
          <Select value={c.protocol ?? "ICMP"} onChange={v => set({ protocol: v as "ICMP" | "TCP" | "UDP" })}>
            {["ICMP", "TCP", "UDP"].map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
        </ConfigField>
      </div>
    </div>
  );

  if (t === "ftp") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <ConfigField label="Host *">
          <Input value={c.host ?? ""} onChange={v => set({ host: v })} placeholder="ftp.example.com" />
        </ConfigField>
        <ConfigField label="Port">
          <NumInput value={c.port} onChange={v => set({ port: v })} placeholder="21" min={1} max={65535} />
        </ConfigField>
        <ConfigField label="Username">
          <Input value={c.username ?? ""} onChange={v => set({ username: v })} placeholder="anonymous" />
        </ConfigField>
        <ConfigField label="Remote Path">
          <Input value={c.remotePath ?? ""} onChange={v => set({ remotePath: v })} placeholder="/pub/test.txt" />
        </ConfigField>
        <ConfigField label="Operation">
          <Select value={c.ftpOperation ?? "connect"} onChange={v => set({ ftpOperation: v as TestConfig["ftpOperation"] })}>
            <option value="connect">Connect</option>
            <option value="list">List Directory</option>
            <option value="download">Download File</option>
            <option value="upload">Upload File</option>
          </Select>
        </ConfigField>
      </div>
    </div>
  );

  if (t === "smtp") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <ConfigField label="SMTP Server *">
          <Input value={c.host ?? ""} onChange={v => set({ host: v })} placeholder="smtp.example.com" />
        </ConfigField>
        <ConfigField label="Port">
          <NumInput value={c.port} onChange={v => set({ port: v })} placeholder="587" min={1} max={65535} />
        </ConfigField>
        <ConfigField label="From">
          <Input value={c.smtpFrom ?? ""} onChange={v => set({ smtpFrom: v })} placeholder="test@example.com" />
        </ConfigField>
        <ConfigField label="To">
          <Input value={c.smtpTo ?? ""} onChange={v => set({ smtpTo: v })} placeholder="probe@example.com" />
        </ConfigField>
        <ConfigField label="Use SSL/TLS">
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", marginTop: 6 }}>
            <input type="checkbox" checked={c.useSSL ?? true} onChange={e => set({ useSSL: e.target.checked })} /> Enable SSL/TLS
          </label>
        </ConfigField>
      </div>
    </div>
  );

  if (t === "tcp") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <ConfigField label="Host *">
          <Input value={c.host ?? ""} onChange={v => set({ host: v })} placeholder="example.com" />
        </ConfigField>
        <ConfigField label="Port *">
          <NumInput value={c.port} onChange={v => set({ port: v })} placeholder="443" min={1} max={65535} />
        </ConfigField>
        <ConfigField label="Timeout (ms)">
          <NumInput value={c.timeoutMs} onChange={v => set({ timeoutMs: v })} placeholder="5000" min={100} />
        </ConfigField>
      </div>
      {thresholds}
    </div>
  );

  if (t === "ssl") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <ConfigField label="Host *">
          <Input value={c.host ?? ""} onChange={v => set({ host: v })} placeholder="example.com" />
        </ConfigField>
        <ConfigField label="Port">
          <NumInput value={c.port} onChange={v => set({ port: v })} placeholder="443" min={1} max={65535} />
        </ConfigField>
        <ConfigField label="Warn Days Before Expiry">
          <NumInput value={c.warnDaysBeforeExpiry} onChange={v => set({ warnDaysBeforeExpiry: v })} placeholder="30" min={1} />
        </ConfigField>
        <ConfigField label="Critical Days Before Expiry">
          <NumInput value={c.criticalDaysBeforeExpiry} onChange={v => set({ criticalDaysBeforeExpiry: v })} placeholder="7" min={1} />
        </ConfigField>
      </div>
    </div>
  );

  if (t === "websocket") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <ConfigField label="WebSocket URL *">
        <Input value={c.url ?? ""} onChange={v => set({ url: v })} placeholder="wss://example.com/ws" />
      </ConfigField>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <ConfigField label="Send Message">
          <Input value={c.wsMessage ?? ""} onChange={v => set({ wsMessage: v })} placeholder='{"type":"ping"}' />
        </ConfigField>
        <ConfigField label="Expected Response">
          <Input value={c.wsExpectedResponse ?? ""} onChange={v => set({ wsExpectedResponse: v })} placeholder='{"type":"pong"}' />
        </ConfigField>
        <ConfigField label="Timeout (ms)">
          <NumInput value={c.timeoutMs} onChange={v => set({ timeoutMs: v })} placeholder="5000" min={100} />
        </ConfigField>
      </div>
      {thresholds}
    </div>
  );

  if (t === "bgp") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <ConfigField label="Prefix *">
          <Input value={c.prefix ?? ""} onChange={v => set({ prefix: v })} placeholder="203.0.113.0/24" />
        </ConfigField>
        <ConfigField label="Origin ASN">
          <Input value={c.asn ?? ""} onChange={v => set({ asn: v })} placeholder="AS64496" />
        </ConfigField>
        <ConfigField label="BGP Community">
          <Input value={c.bgpCommunity ?? ""} onChange={v => set({ bgpCommunity: v })} placeholder="64496:100" />
        </ConfigField>
      </div>
    </div>
  );

  if (t === "streaming") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <ConfigField label="Stream URL *">
        <Input value={c.url ?? ""} onChange={v => set({ url: v })} placeholder="https://example.com/live/stream.m3u8" />
      </ConfigField>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <ConfigField label="Protocol">
          <Select value={c.protocol ?? "HLS"} onChange={v => set({ protocol: v as "HLS" | "DASH" | "RTMP" | "RTSP" })}>
            {["HLS", "DASH", "RTMP", "RTSP"].map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
        </ConfigField>
        <ConfigField label="Expected Bitrate (kbps)">
          <NumInput value={c.expectedBitrate} onChange={v => set({ expectedBitrate: v })} placeholder="1500" min={0} />
        </ConfigField>
        <ConfigField label="Buffering Threshold (%)">
          <NumInput value={c.bufferingThreshold} onChange={v => set({ bufferingThreshold: v })} placeholder="5" min={0} max={100} />
        </ConfigField>
      </div>
      {thresholds}
    </div>
  );

  if (t === "cdn") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {commonHttp}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <ConfigField label="Expected Edge Location">
          <Input value={c.expectedEdgeLocation ?? ""} onChange={v => set({ expectedEdgeLocation: v })} placeholder="SJC (San Jose)" />
        </ConfigField>
        <ConfigField label="Expected Cache Header">
          <Input value={c.expectedCacheHeader ?? ""} onChange={v => set({ expectedCacheHeader: v })} placeholder="HIT" />
        </ConfigField>
        <ConfigField label="CDN Provider">
          <Select value={c.cdnProvider ?? "Akamai"} onChange={v => set({ cdnProvider: v })}>
            {["Akamai", "Cloudflare", "Fastly", "AWS CloudFront", "Azure CDN", "Google Cloud CDN", "Other"].map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
        </ConfigField>
      </div>
      {thresholds}
    </div>
  );

  if (t === "playwright") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <ConfigField label="Start URL">
          <Input value={c.url ?? ""} onChange={v => set({ url: v })} placeholder="https://example.com" />
        </ConfigField>
        <ConfigField label="Browser">
          <Select value={c.browser ?? "chromium"} onChange={v => set({ browser: v as TestConfig["browser"] })}>
            <option value="chromium">Chromium</option>
            <option value="firefox">Firefox</option>
            <option value="webkit">WebKit (Safari)</option>
          </Select>
        </ConfigField>
      </div>
      <ConfigField label="Playwright Script">
        <Textarea value={c.playwrightScript ?? ""} onChange={v => set({ playwrightScript: v })} rows={8} mono />
      </ConfigField>
      {thresholds}
    </div>
  );

  if (t === "transaction") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <ConfigField label="Start URL">
          <Input value={c.url ?? ""} onChange={v => set({ url: v })} placeholder="https://example.com" />
        </ConfigField>
        <ConfigField label="Browser">
          <Select value={c.browser ?? "chromium"} onChange={v => set({ browser: v as TestConfig["browser"] })}>
            <option value="chromium">Chromium</option>
            <option value="firefox">Firefox</option>
            <option value="webkit">WebKit (Safari)</option>
          </Select>
        </ConfigField>
      </div>
      <Label>Transaction Steps</Label>
      <StepsEditor steps={c.steps ?? []} onChange={steps => setForm(f => ({ ...f, config: { ...f.config, steps } }))} />
      {thresholds}
    </div>
  );

  if (t === "network") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <ConfigField label="Target Host *">
          <Input value={c.host ?? ""} onChange={v => set({ host: v })} placeholder="example.com" />
        </ConfigField>
        <ConfigField label="Protocol">
          <Select value={c.protocol ?? "TCP"} onChange={v => set({ protocol: v as "TCP" | "UDP" | "ICMP" })}>
            {["TCP", "UDP", "ICMP"].map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
        </ConfigField>
        <ConfigField label="Min Bandwidth (Mbps)">
          <NumInput value={c.bandwidth} onChange={v => set({ bandwidth: v })} placeholder="100" min={0} />
        </ConfigField>
        <ConfigField label="Max Jitter (ms)">
          <NumInput value={c.jitterThreshold} onChange={v => set({ jitterThreshold: v })} placeholder="20" min={0} />
        </ConfigField>
        <ConfigField label="Max Packet Loss (%)">
          <NumInput value={c.packetLossThreshold} onChange={v => set({ packetLossThreshold: v })} placeholder="1" min={0} max={100} />
        </ConfigField>
      </div>
      {thresholds}
    </div>
  );

  return <div style={{ color: "var(--gcp-text-secondary)", fontSize: 13 }}>No configuration needed for this test type.</div>;
}

// ── Step 4 — Assertions ────────────────────────────────────────────────────

function StepAssertions({ form, setForm }: { form: WizardForm; setForm: React.Dispatch<React.SetStateAction<WizardForm>> }) {
  const fields = ASSERTION_FIELDS[form.testType] ?? [];
  const assertions = form.assertions;

  const add = () => {
    const defaultField = fields[0]?.value ?? "responseTime";
    setForm(f => ({
      ...f,
      assertions: [...f.assertions, { id: genId(), field: defaultField, operator: "<", value: "", unit: fields[0]?.units?.[0] }],
    }));
  };

  const remove = (id: string) => setForm(f => ({ ...f, assertions: f.assertions.filter(a => a.id !== id) }));

  const update = (id: string, patch: Partial<TestAssertion>) =>
    setForm(f => ({ ...f, assertions: f.assertions.map(a => a.id === id ? { ...a, ...patch } : a) }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ fontSize: 12, color: "var(--gcp-text-secondary)" }}>
        Define pass/fail criteria. All assertions must pass for the test to succeed.
      </p>

      {assertions.length === 0 && (
        <div style={{ textAlign: "center", padding: "24px 0", color: "var(--gcp-text-secondary)", fontSize: 13, border: "1px dashed var(--gcp-grey)", borderRadius: 6 }}>
          No assertions yet — click "Add Assertion" to define pass criteria.
        </div>
      )}

      {assertions.map((a, idx) => {
        const fieldDef = fields.find(f => f.value === a.field);
        const noValue = a.operator === "exists" || a.operator === "not_exists";
        return (
          <div key={a.id} style={{ border: "1px solid var(--gcp-grey)", borderRadius: 6, padding: "10px 12px", background: "var(--gcp-surface)", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", minWidth: 20 }}>#{idx + 1}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gcp-blue)", marginLeft: "auto" }}>WHEN</span>
              <button onClick={() => remove(a.id)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--gcp-red)", marginLeft: 4 }}><X size={12} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 1fr 80px", gap: 6, alignItems: "center" }}>
              <select className="gcp-input" value={a.field} onChange={e => {
                const newField = fields.find(f => f.value === e.target.value);
                update(a.id, { field: e.target.value, unit: newField?.units?.[0] });
              }}>
                {fields.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              <select className="gcp-input" value={a.operator} onChange={e => update(a.id, { operator: e.target.value as TestAssertion["operator"] })}>
                {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {noValue
                ? <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)", fontStyle: "italic", padding: "0 8px" }}>—</div>
                : <input className="gcp-input" value={a.value} onChange={e => update(a.id, { value: e.target.value })} placeholder="value" />
              }
              {fieldDef?.units && fieldDef.units.length > 0 ? (
                <select className="gcp-input" value={a.unit ?? fieldDef.units[0]} onChange={e => update(a.id, { unit: e.target.value })}>
                  {fieldDef.units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              ) : <div />}
            </div>
          </div>
        );
      })}

      <button onClick={add} className="gcp-button" style={{ alignSelf: "flex-start", fontSize: 12 }}>
        <Plus size={12} /> Add Assertion
      </button>
    </div>
  );
}

// ── Step 5 — Import / Export ───────────────────────────────────────────────

function StepImportExport({ form, setForm }: { form: WizardForm; setForm: React.Dispatch<React.SetStateAction<WizardForm>> }) {
  const [mode, setMode] = React.useState<"import" | "export">("import");
  const [importText, setImportText] = React.useState("");
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null);
  const [exportFmt, setExportFmt] = React.useState<"json" | "yaml" | "xml">("json");
  const [copied, setCopied] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const currentAsTestCase = (): TestCase => ({
    id: genId(), ...formToTestCase(form) as TestCase,
  });

  const exportPreview = React.useMemo(() => {
    const tc = currentAsTestCase();
    if (exportFmt === "json") return exportAsJSON([tc]);
    if (exportFmt === "yaml") return exportAsYAML([tc]);
    return exportAsXML([tc]);
  }, [exportFmt, form]);

  const handleImport = () => {
    if (!importText.trim()) return;
    const result = importAuto(importText);
    setImportResult(result);
    if (result.tests.length > 0) {
      const first = result.tests[0];
      setForm(f => ({
        ...f,
        name: first.name ?? f.name,
        description: first.description ?? f.description,
        testType: first.testType ?? f.testType,
        category: first.category ?? f.category,
        priority: first.priority ?? f.priority,
        owner: first.owner ?? f.owner,
        status: first.status ?? f.status,
        tags: (first.tags ?? []).join(", "),
        preconditions: first.preconditions ?? f.preconditions,
        expectedBehavior: first.expectedBehavior ?? f.expectedBehavior,
        scriptPath: first.scriptPath ?? f.scriptPath,
        config: first.config ?? f.config,
        assertions: first.assertions ?? f.assertions,
      }));
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImportText(String(ev.target?.result ?? ""));
    reader.readAsText(file);
  };

  const copy = () => {
    navigator.clipboard.writeText(exportPreview).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 0, border: "1px solid var(--gcp-grey)", borderRadius: 4, overflow: "hidden", alignSelf: "flex-start" }}>
        {(["import", "export"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{ padding: "7px 18px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: mode === m ? 700 : 400, background: mode === m ? "var(--gcp-blue)" : "var(--gcp-surface)", color: mode === m ? "white" : "var(--gcp-text)" }}>
            {m === "import" ? <><Upload size={12} style={{ marginRight: 5 }} />Import</> : <><Download size={12} style={{ marginRight: 5 }} />Export Preview</>}
          </button>
        ))}
      </div>

      {mode === "import" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input ref={fileRef} type="file" accept=".json,.yaml,.yml,.xml" style={{ display: "none" }} onChange={handleFile} />
            <button onClick={() => fileRef.current?.click()} className="gcp-button" style={{ fontSize: 12 }}>
              <Upload size={12} /> Upload File (.json / .yaml / .xml)
            </button>
            <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>or paste below</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["json", "yaml", "xml"] as const).map(fmt => (
              <button key={fmt} style={{ padding: "4px 10px", border: "1px solid var(--gcp-grey)", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 600, background: "var(--gcp-surface)", color: "var(--gcp-blue)" }}
                onClick={() => {
                  const ex: Record<string, unknown> = {
                    name: "Example CDN Cache Validation",
                    testType: "cdn",
                    category: "caching",
                    priority: "P1",
                    owner: "alice@co.com",
                    status: "active",
                    config: { url: "https://cdn.example.com/assets/logo.png", method: "GET", expectedStatusCode: 200, expectedCacheHeader: "HIT" },
                    assertions: [{ id: "a1", field: "responseTime", operator: "<", value: "500", unit: "ms" }, { id: "a2", field: "cacheHit", operator: "=", value: "true" }],
                  };
                  if (fmt === "json") setImportText(JSON.stringify([ex], null, 2));
                  else if (fmt === "yaml") { import("js-yaml").then(y => setImportText(y.dump([ex]))); }
                  else setImportText(`<?xml version="1.0"?>\n<testCases>\n  <testCase>\n    <name>Example CDN Cache Validation</name>\n    <testType>cdn</testType>\n    <category>caching</category>\n    <priority>P1</priority>\n  </testCase>\n</testCases>`);
                }}
              >
                Load {fmt.toUpperCase()} example
              </button>
            ))}
          </div>
          <textarea
            className="gcp-input"
            style={{ fontFamily: "var(--font-mono)", fontSize: 11, height: 200, resize: "vertical" }}
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder={"Paste JSON, YAML, or XML here…\n\nFormats supported:\n• JSON: [{\"name\": \"...\", \"testType\": \"cdn\", ...}]\n• YAML: - name: ...\n         testType: cdn\n• XML: <testCases><testCase>...</testCase></testCases>"}
          />
          {importResult && (
            <div style={{ fontSize: 12, border: `1px solid ${importResult.errors.length === 0 ? "var(--gcp-green)" : "var(--gcp-orange)"}`, borderRadius: 4, padding: "8px 12px", background: importResult.errors.length === 0 ? "#e8f5e9" : "#fff3e0" }}>
              {importResult.tests.length > 0 && (
                <div style={{ color: "var(--gcp-green)", fontWeight: 700, marginBottom: importResult.errors.length ? 4 : 0 }}>
                  ✓ Imported {importResult.tests.length} test{importResult.tests.length > 1 ? "s" : ""} from {importResult.format.toUpperCase()}. Form pre-filled with first result.
                </div>
              )}
              {importResult.errors.map((e, i) => (
                <div key={i} style={{ color: "var(--gcp-orange)", display: "flex", alignItems: "center", gap: 4 }}>
                  <AlertCircle size={11} /> {e}
                </div>
              ))}
            </div>
          )}
          <button onClick={handleImport} disabled={!importText.trim()} className="gcp-button-primary" style={{ alignSelf: "flex-start", fontSize: 12 }}>
            <Check size={12} /> Parse & Pre-fill Form
          </button>
        </div>
      )}

      {mode === "export" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {(["json", "yaml", "xml"] as const).map(fmt => (
              <button key={fmt} onClick={() => setExportFmt(fmt)}
                style={{ padding: "6px 14px", border: `1px solid ${exportFmt === fmt ? "var(--gcp-blue)" : "var(--gcp-grey)"}`, borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: exportFmt === fmt ? 700 : 400, background: exportFmt === fmt ? "var(--gcp-blue-bg)" : "var(--gcp-surface)", color: exportFmt === fmt ? "var(--gcp-blue)" : "var(--gcp-text)", display: "flex", alignItems: "center", gap: 5 }}>
                {fmt === "json" ? <FileJson size={12} /> : fmt === "yaml" ? <FileText size={12} /> : <Code2 size={12} />}
                {fmt.toUpperCase()}
              </button>
            ))}
            <button onClick={copy} className="gcp-button" style={{ fontSize: 12, marginLeft: "auto" }}>
              {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
            </button>
          </div>
          <pre style={{ background: "#1e1e1e", color: "#d4d4d4", borderRadius: 6, padding: 14, overflow: "auto", fontSize: 11, lineHeight: 1.5, maxHeight: 280, fontFamily: "var(--font-mono)" }}>
            {exportPreview}
          </pre>
          <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
            <Info size={11} /> Use "Export All" button on the Test Manager page to download all tests as a file.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Wizard shell ───────────────────────────────────────────────────────────

const STEPS = [
  { id: "type",    label: "Test Type",    short: "Type" },
  { id: "info",    label: "Basic Info",   short: "Info" },
  { id: "config",  label: "Configuration", short: "Config" },
  { id: "assert",  label: "Assertions",   short: "Assert" },
  { id: "import",  label: "Import / Export", short: "I/O" },
];

export function TestWizardModal({ tc, onSave, onClose }: {
  tc?: TestCase;
  onSave: (data: Partial<TestCase>) => void;
  onClose: () => void;
}) {
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState<WizardForm>(() => blankForm(tc));
  const [error, setError] = React.useState("");

  const isEdit = !!tc;
  const typeInfo = TEST_TYPES.find(t => t.id === form.testType)!;

  const validate = (): boolean => {
    if (step === 1 && !form.name.trim()) { setError("Test name is required."); return false; }
    setError("");
    return true;
  };

  const next = () => { if (validate()) setStep(s => Math.min(s + 1, STEPS.length - 1)); };
  const prev = () => { setError(""); setStep(s => Math.max(s - 1, 0)); };

  const handleSave = () => {
    if (!form.name.trim()) { setStep(1); setError("Test name is required."); return; }
    onSave(formToTestCase(form, tc));
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "var(--gcp-surface)", borderRadius: 8, width: "min(780px, 96vw)", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 16px 60px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--gcp-grey)", display: "flex", alignItems: "center", gap: 10 }}>
          <typeInfo.icon size={16} style={{ color: typeInfo.color }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{isEdit ? "Edit Test Case" : "New Test Case"}</div>
            <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>{typeInfo.label} · {STEPS[step].label}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: "auto", border: "none", background: "none", cursor: "pointer", color: "var(--gcp-text-secondary)", fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {/* Step tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--gcp-grey)", padding: "0 20px", overflowX: "auto" }}>
          {STEPS.map((s, i) => (
            <button key={s.id} onClick={() => { if (validate() || i < step) setStep(i); }}
              style={{ padding: "8px 14px", border: "none", background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: step === i ? 700 : 400, color: step === i ? "var(--gcp-blue)" : i < step ? "var(--gcp-green)" : "var(--gcp-text-secondary)", borderBottom: step === i ? "2px solid var(--gcp-blue)" : "2px solid transparent", marginBottom: -1, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s" }}>
              {i < step && <Check size={11} style={{ color: "var(--gcp-green)" }} />}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: step === i ? "var(--gcp-blue)" : "var(--gcp-text-secondary)" }}>{i + 1}</span>
              {s.short}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
          {error && (
            <div style={{ marginBottom: 10, padding: "7px 12px", background: "#fce8e6", border: "1px solid var(--gcp-red)", borderRadius: 4, fontSize: 12, color: "var(--gcp-red)", display: "flex", alignItems: "center", gap: 6 }}>
              <AlertCircle size={13} /> {error}
            </div>
          )}
          {step === 0 && <StepTypeSelect form={form} setForm={setForm} />}
          {step === 1 && <StepBasicInfo form={form} setForm={setForm} />}
          {step === 2 && <StepConfig form={form} setForm={setForm} />}
          {step === 3 && <StepAssertions form={form} setForm={setForm} />}
          {step === 4 && <StepImportExport form={form} setForm={setForm} />}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--gcp-grey)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>Step {step + 1} of {STEPS.length}</div>
          <div style={{ flex: 1 }} />
          {step > 0 && (
            <button onClick={prev} className="gcp-button" style={{ fontSize: 13 }}>
              <ChevronLeft size={14} /> Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={next} className="gcp-button-primary" style={{ fontSize: 13 }}>
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button onClick={handleSave} className="gcp-button-primary" style={{ fontSize: 13 }}>
              <Check size={14} /> {isEdit ? "Save Changes" : "Create Test Case"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
