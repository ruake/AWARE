import React from "react";
import type { TestSuite } from "@/lib/types";
import { X, Check } from "lucide-react";

export function SuiteEditor({ suite, allSuites, onSave, onClose }: {
  suite?: TestSuite | null;
  allSuites: TestSuite[];
  onSave: (data: Omit<TestSuite, "id" | "createdAt" | "updatedAt">) => void;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const [form, setForm] = React.useState<Omit<TestSuite, "id" | "createdAt" | "updatedAt">>({
    name: suite?.name ?? "",
    description: suite?.description ?? "",
    parentId: suite?.parentId ?? null,
    testIds: suite?.testIds ?? [],
    config: suite?.config ?? { target: "Prod", environment: "Production", parallelism: 4, retries: 1, failFast: false, timeoutMinutes: 30, integration: { slackChannel: "", notifyOn: ["fail"], githubCommentPr: false, githubDeploymentStatus: false, requireApproval: false, approvers: [] } },
    tags: suite?.tags ?? [],
    schedule: suite?.schedule ?? null,
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ position: "relative", width: "100%", maxWidth: 640, maxHeight: "90vh", overflow: "auto", background: "var(--gcp-surface)", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "1px solid var(--gcp-grey)", padding: 24, display: "flex", flexDirection: "column", gap: 16 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{suite ? "Edit Suite" : "New Suite"}</h2>
          <button onClick={onClose} style={{ padding: 4, border: "none", background: "none", cursor: "pointer", color: "var(--gcp-text-secondary)", borderRadius: 4 }}><X size={18} /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ gridColumn: "span 2" }}>
            <label style={{ fontSize: 11, textTransform: "uppercase", color: "var(--gcp-text-secondary)", fontWeight: 500 }}>Name</label>
            <input className="gcp-input" style={{ width: "100%", marginTop: 4 }} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Suite name" />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={{ fontSize: 11, textTransform: "uppercase", color: "var(--gcp-text-secondary)", fontWeight: 500 }}>Description</label>
            <textarea className="gcp-input" style={{ width: "100%", marginTop: 4, minHeight: 50 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 11, textTransform: "uppercase", color: "var(--gcp-text-secondary)", fontWeight: 500 }}>Parent Suite</label>
            <select className="gcp-input" style={{ width: "100%", marginTop: 4 }} value={form.parentId ?? ""} onChange={e => setForm(f => ({ ...f, parentId: e.target.value || null }))}>
              <option value="">None (root)</option>
              {allSuites.filter(s => s.id !== suite?.id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, textTransform: "uppercase", color: "var(--gcp-text-secondary)", fontWeight: 500 }}>Schedule (cron)</label>
            <input className="gcp-input" style={{ width: "100%", marginTop: 4 }} value={form.schedule ?? ""} onChange={e => setForm(f => ({ ...f, schedule: e.target.value || null }))} placeholder="0 6 * * 1-5" />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label style={{ fontSize: 11, textTransform: "uppercase", color: "var(--gcp-text-secondary)", fontWeight: 500, marginBottom: 4, display: "block" }}>Config</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: 12, background: "var(--gcp-grey-bg)", borderRadius: 8 }}>
              <div>
                <label style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>Target</label>
                <select className="gcp-input" style={{ width: "100%", marginTop: 2, fontSize: 12 }} value={form.config.target} onChange={e => setForm(f => ({ ...f, config: { ...f.config, target: e.target.value } }))}>
                  <option>Prod</option><option>UAT</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>Env</label>
                <select className="gcp-input" style={{ width: "100%", marginTop: 2, fontSize: 12 }} value={form.config.environment} onChange={e => setForm(f => ({ ...f, config: { ...f.config, environment: e.target.value } }))}>
                  <option>Production</option><option>Staging</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>Parallelism</label>
                <input type="number" className="gcp-input" style={{ width: "100%", marginTop: 2, fontSize: 12 }} value={form.config.parallelism} onChange={e => setForm(f => ({ ...f, config: { ...f.config, parallelism: Number(e.target.value) } }))} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>Retries</label>
                <input type="number" className="gcp-input" style={{ width: "100%", marginTop: 2, fontSize: 12 }} value={form.config.retries} onChange={e => setForm(f => ({ ...f, config: { ...f.config, retries: Number(e.target.value) } }))} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>Timeout (min)</label>
                <input type="number" className="gcp-input" style={{ width: "100%", marginTop: 2, fontSize: 12 }} value={form.config.timeoutMinutes} onChange={e => setForm(f => ({ ...f, config: { ...f.config, timeoutMinutes: Number(e.target.value) } }))} />
              </div>
              <div style={{ display: "flex", alignItems: "center", paddingTop: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.config.failFast} onChange={e => setForm(f => ({ ...f, config: { ...f.config, failFast: e.target.checked } }))} style={{ accentColor: "var(--gcp-blue)" }} />
                  <span style={{ fontSize: 11 }}>Fail fast</span>
                </label>
              </div>
            </div>
          </div>

          <div style={{ gridColumn: "span 2" }}>
            <label style={{ fontSize: 11, textTransform: "uppercase", color: "var(--gcp-text-secondary)", fontWeight: 500, marginBottom: 4, display: "block" }}>Integrations</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: 12, background: "var(--gcp-grey-bg)", borderRadius: 8 }}>
              <div>
                <label style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>Slack Channel</label>
                <input className="gcp-input" style={{ width: "100%", marginTop: 2, fontSize: 12 }} value={form.config.integration?.slackChannel ?? ""} onChange={e => setForm(f => ({ ...f, config: { ...f.config, integration: { ...f.config.integration!, slackChannel: e.target.value } } }))} placeholder="#alerts" />
              </div>
              <div>
                <label style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>Slack Webhook URL</label>
                <input className="gcp-input" style={{ width: "100%", marginTop: 2, fontSize: 12 }} value={form.config.integration?.slackWebhookUrl ?? ""} onChange={e => setForm(f => ({ ...f, config: { ...f.config, integration: { ...f.config.integration!, slackWebhookUrl: e.target.value } } }))} placeholder="https://hooks.slack.com/…" />
              </div>
              <div>
                <label style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>Webhook URL</label>
                <input className="gcp-input" style={{ width: "100%", marginTop: 2, fontSize: 12 }} value={form.config.integration?.webhookUrl ?? ""} onChange={e => setForm(f => ({ ...f, config: { ...f.config, integration: { ...f.config.integration!, webhookUrl: e.target.value } } }))} placeholder="https://hooks.example.com/notify" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.config.integration?.githubCommentPr ?? false} onChange={e => setForm(f => ({ ...f, config: { ...f.config, integration: { ...f.config.integration!, githubCommentPr: e.target.checked } } }))} style={{ accentColor: "var(--gcp-blue)" }} />
                  <span style={{ fontSize: 11 }}>Post PR comments</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.config.integration?.githubDeploymentStatus ?? false} onChange={e => setForm(f => ({ ...f, config: { ...f.config, integration: { ...f.config.integration!, githubDeploymentStatus: e.target.checked } } }))} style={{ accentColor: "var(--gcp-blue)" }} />
                  <span style={{ fontSize: 11 }}>Update deployment status</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.config.integration?.requireApproval ?? false} onChange={e => setForm(f => ({ ...f, config: { ...f.config, integration: { ...f.config.integration!, requireApproval: e.target.checked } } }))} style={{ accentColor: "var(--gcp-blue)" }} />
                  <span style={{ fontSize: 11 }}>Require approval</span>
                </label>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>Approvers (comma-separated)</label>
                <input className="gcp-input" style={{ width: "100%", marginTop: 2, fontSize: 12 }} value={(form.config.integration?.approvers ?? []).join(", ")} onChange={e => setForm(f => ({ ...f, config: { ...f.config, integration: { ...f.config.integration!, approvers: e.target.value.split(",").map(s => s.trim()).filter(Boolean) } } }))} placeholder="email@co.com, email2@co.com" />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>Notify On</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  {(["pass", "fail", "deploy", "approval"] as const).map(n => (
                    <span key={n} onClick={() => {
                      const current = form.config.integration?.notifyOn ?? [];
                      const next = current.includes(n) ? current.filter(x => x !== n) : [...current, n];
                      setForm(f => ({ ...f, config: { ...f.config, integration: { ...f.config.integration!, notifyOn: next } } }));
                    }} style={{
                      padding: "4px 8px", borderRadius: 4, fontSize: 11, cursor: "pointer", border: "1px solid",
                      background: (form.config.integration?.notifyOn ?? []).includes(n) ? "var(--gcp-blue)" : "transparent",
                      color: (form.config.integration?.notifyOn ?? []).includes(n) ? "white" : "var(--gcp-text-secondary)",
                      borderColor: (form.config.integration?.notifyOn ?? []).includes(n) ? "var(--gcp-blue)" : "var(--gcp-grey)",
                    }}>{n}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 8, borderTop: "1px solid var(--gcp-grey)" }}>
          <button onClick={onClose} className="gcp-button" style={{ padding: "8px 16px" }}>Cancel</button>
          <button onClick={() => onSave(form)} className="gcp-button gcp-button-primary" style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: 6 }}>
            <Check size={14} /> {suite ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
