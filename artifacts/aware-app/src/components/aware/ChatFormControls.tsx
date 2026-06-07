import React from "react";

export interface FormField {
  question: string;
  type: "select" | "radio" | "text" | "toggle";
  id: string;
  options?: string[] | { value: string; label: string }[];
  default?: string | boolean;
}

interface ChatFormControlsProps {
  fields: FormField[];
  onSubmit: (values: Record<string, unknown>) => void;
  onCancel?: () => void;
}

function normalizeOptions(opts?: string[] | { value: string; label: string }[]): { value: string; label: string }[] {
  if (!opts) return [];
  return opts.map(o => typeof o === "string" ? { value: o, label: o } : o);
}

export function ChatFormControls({ fields, onSubmit, onCancel }: ChatFormControlsProps) {
  const [values, setValues] = React.useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    fields.forEach(f => {
      if (f.type === "toggle") init[f.id] = f.default ?? false;
      else if (f.options && f.options.length > 0) {
        const opts = normalizeOptions(f.options);
        init[f.id] = f.default ?? opts[0].value;
      } else init[f.id] = f.default ?? "";
    });
    return init;
  });

  const done = fields.every(f => {
    const v = values[f.id];
    if (f.type === "toggle") return true;
    return v !== "" && v !== undefined && v !== null;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8, padding: 12, background: "var(--gcp-surface)", border: "1px solid var(--gcp-grey)", borderRadius: 8 }}>
      {fields.map(f => (
        <div key={f.id}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--gcp-text)" }}>{f.question}</div>
          {f.type === "select" && (
            <select
              className="gcp-input"
              style={{ width: "100%", fontSize: 12 }}
              value={String(values[f.id] ?? "")}
              onChange={e => setValues(p => ({ ...p, [f.id]: e.target.value }))}
            >
              {normalizeOptions(f.options).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}
          {f.type === "radio" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {normalizeOptions(f.options).map(o => {
                const active = values[f.id] === o.value;
                return (
                  <span
                    key={o.value}
                    onClick={() => setValues(p => ({ ...p, [f.id]: o.value }))}
                    style={{
                      padding: "5px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer",
                      border: `1px solid ${active ? "var(--gcp-blue)" : "var(--gcp-grey)"}`,
                      background: active ? "var(--gcp-blue)" : "transparent",
                      color: active ? "white" : "var(--gcp-text-secondary)",
                      fontWeight: active ? 600 : 400,
                      transition: "all 0.15s",
                    }}
                  >
                    {o.label}
                  </span>
                );
              })}
            </div>
          )}
          {f.type === "text" && (
            <input
              className="gcp-input"
              style={{ width: "100%", fontSize: 12 }}
              value={String(values[f.id] ?? "")}
              onChange={e => setValues(p => ({ ...p, [f.id]: e.target.value }))}
              placeholder="Type your answer..."
            />
          )}
          {f.type === "toggle" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                onClick={() => setValues(p => ({ ...p, [f.id]: !p[f.id] }))}
                style={{
                  width: 36, height: 20, borderRadius: 10,
                  background: values[f.id] ? "var(--gcp-blue)" : "var(--gcp-grey)",
                  position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
                }}
              >
                <span style={{
                  position: "absolute", top: 2, width: 16, height: 16, borderRadius: 8,
                  background: "white", transition: "left 0.2s",
                  left: values[f.id] ? 18 : 2,
                }} />
              </span>
              <span style={{ fontSize: 12, color: "var(--gcp-text-secondary)" }}>
                {values[f.id] ? "Yes" : "No"}
              </span>
            </div>
          )}
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
        {onCancel && (
          <button onClick={onCancel} className="gcp-button" style={{ fontSize: 11 }}>Cancel</button>
        )}
        <button
          onClick={() => onSubmit(values)}
          className="gcp-button gcp-button-primary"
          style={{ fontSize: 11 }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export function parseFormBlocks(content: string): { text: string; blocks: { fields: FormField[] }[] } {
  const parts: string[] = [];
  const blocks: { fields: FormField[] }[] = [];
  let remaining = content;
  const startMarker = "[FORM]";
  const endMarker = "[/FORM]";

  while (true) {
    const startIdx = remaining.indexOf(startMarker);
    if (startIdx === -1) {
      parts.push(remaining);
      break;
    }
    parts.push(remaining.substring(0, startIdx));
    remaining = remaining.substring(startIdx + startMarker.length);
    const endIdx = remaining.indexOf(endMarker);
    if (endIdx === -1) {
      parts.push(remaining);
      break;
    }
    const jsonStr = remaining.substring(0, endIdx).trim();
    try {
      const parsed = JSON.parse(jsonStr);
      const fieldsArray = Array.isArray(parsed) ? parsed : parsed.fields ?? [];
      blocks.push({ fields: fieldsArray });
    } catch {
      parts.push(`[FORM]${jsonStr}[/FORM]`);
    }
    remaining = remaining.substring(endIdx + endMarker.length);
  }

  return { text: parts.join(""), blocks };
}
