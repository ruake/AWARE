import React from "react";
import { getEnvConfigs, addEnvConfig, updateEnvConfig, removeEnvConfig, resetEnvConfigs, subscribeToEnvConfigs } from "@/lib/envConfig";
import type { EnvironmentConfig } from "@/lib/types";
import { Settings, Plus, Trash2, RotateCcw } from "lucide-react";

export function EnvironmentConfigPanel({ onClose }: { onClose: () => void }) {
  const [configs, setConfigs] = React.useState<EnvironmentConfig[]>(getEnvConfigs());
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);

  React.useEffect(() => {
    const unsub = subscribeToEnvConfigs(() => setConfigs(getEnvConfigs()));
    return unsub;
  }, []);

  return (
    <div style={{ width: 380, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden", borderLeft: "3px solid var(--gcp-blue)", background: "var(--gcp-surface)" }} className="gcp-card">
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--gcp-grey)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--gcp-blue-bg)", flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gcp-blue)", display: "flex", alignItems: "center", gap: 6 }}><Settings size={13} /> Environment Config</span>
        <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--gcp-text-secondary)", fontSize: 18, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        {configs.map(env => (
          editingId === env.id ? (
            <EnvConfigForm
              key={env.id}
              initial={env}
              onSave={(updates) => { updateEnvConfig(env.id, updates); setEditingId(null); }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <EnvConfigCard key={env.id} env={env} onEdit={() => setEditingId(env.id)} onRemove={() => removeEnvConfig(env.id)} />
          )
        ))}
        {adding && (
          <EnvConfigForm
            initial={{ id: "", label: "", target: "", stage: "", baseUrl: "", ips: [], network: "staging" }}
            onSave={(updates) => {
              const cfg: EnvironmentConfig = {
                id: `env_${Date.now()}`,
                label: updates.label || "",
                target: updates.target || "",
                stage: updates.stage || "",
                baseUrl: updates.baseUrl || "",
                ips: updates.ips || [],
                network: (updates.network as "staging" | "production") || "staging",
              };
              addEnvConfig(cfg);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        )}
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <button onClick={() => setAdding(true)} className="gcp-button gcp-button-xs" style={{ flex: 1, justifyContent: "center", fontWeight: 600, borderStyle: "dashed", background: "var(--gcp-surface)", color: "var(--gcp-blue)" }}>
            <Plus size={12} /> Add Environment
          </button>
          <button onClick={() => { resetEnvConfigs(); }} className="gcp-button gcp-button-xs" style={{ fontWeight: 600, background: "var(--gcp-surface)", color: "var(--gcp-text-secondary)" }}>
            <RotateCcw size={12} /> Reset
          </button>
        </div>
      </div>
    </div>
  );
}

function EnvConfigCard({ env, onEdit, onRemove }: { env: EnvironmentConfig; onEdit: () => void; onRemove: () => void }) {
  return (
    <div style={{ padding: "8px 10px", border: "1px solid var(--gcp-grey)", borderRadius: 4, fontSize: 11 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontWeight: 700, color: "var(--gcp-text)" }}>{env.label}</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={onEdit} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--gcp-blue)", fontSize: 11 }}>Edit</button>
          <button onClick={onRemove} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--gcp-red)", display: "flex" }}><Trash2 size={12} /></button>
        </div>
      </div>
      <div style={{ color: "var(--gcp-text-secondary)", lineHeight: 1.6 }}>
        <div>{env.target} / {env.stage} &middot; {env.network}</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>{env.baseUrl}</div>
        {env.ips.length > 0 && <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--gcp-text-secondary)" }}>IPs: {env.ips.join(", ")}</div>}
      </div>
    </div>
  );
}

function EnvConfigForm({ initial, onSave, onCancel }: { initial: Partial<EnvironmentConfig>; onSave: (data: Partial<EnvironmentConfig>) => void; onCancel: () => void }) {
  const [label, setLabel] = React.useState(initial.label ?? "");
  const [target, setTarget] = React.useState(initial.target ?? "");
  const [stage, setStage] = React.useState(initial.stage ?? "");
  const [baseUrl, setBaseUrl] = React.useState(initial.baseUrl ?? "");
  const [ips, setIps] = React.useState(initial.ips?.join(", ") ?? "");
  const [network, setNetwork] = React.useState<"staging" | "production">(initial.network ?? "staging");

  return (
    <div style={{ padding: "8px 10px", border: "1px solid var(--gcp-blue)", borderRadius: 4, fontSize: 11, display: "flex", flexDirection: "column", gap: 6 }}>
      <Field label="Label" value={label} onChange={setLabel} placeholder="Prod/Production" />
      <Field label="Target" value={target} onChange={setTarget} placeholder="Prod" />
      <Field label="Stage" value={stage} onChange={setStage} placeholder="Production" />
      <Field label="Base URL" value={baseUrl} onChange={setBaseUrl} placeholder="https://www.example.com" />
      <Field label="IPs (comma-sep)" value={ips} onChange={setIps} placeholder="203.0.113.1, 203.0.113.2" />
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--gcp-text-secondary)", marginBottom: 3 }}>Network</div>
        <select value={network} onChange={e => setNetwork(e.target.value as "staging" | "production")} style={{ width: "100%", padding: "4px 6px", fontSize: 11, border: "1px solid var(--gcp-grey)", borderRadius: 3, background: "var(--gcp-surface)" }}>
          <option value="staging">Staging</option>
          <option value="production">Production</option>
        </select>
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <button onClick={onCancel} className="gcp-button gcp-button-xs" style={{ padding: "4px 10px" }}>Cancel</button>
        <button onClick={() => onSave({ label, target, stage, baseUrl, ips: ips.split(",").map(s => s.trim()).filter(Boolean), network })} className="gcp-button gcp-button-xs" style={{ padding: "4px 10px", border: "none", background: "var(--gcp-blue)", color: "#fff" }}>Save</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--gcp-text-secondary)", marginBottom: 3 }}>{label}</div>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="gcp-input" style={{ width: "100%", fontSize: 11 }} />
    </div>
  );
}
