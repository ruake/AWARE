import React from "react";
import { useSyncedUrlState } from "@/lib/urlState";
import { QUICK_ACTIONS } from "@/lib/copilot/quickActions";
import { Plus, Bot, Loader2, Zap } from "lucide-react";

export function CopilotPanel() {
  const [, setAction] = useSyncedUrlState<string | null>("copilotAction", null);
  const [, setNewChat] = useSyncedUrlState<number | null>("copilotNew", null);

  const handleAction = (message: string) => {
    setAction(message);
  };

  const handleNewChat = () => {
    setNewChat(Date.now());
  };

  return (
    <>
      {/* New Chat button */}
      <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--proof-border)" }}>
        <button
          onClick={handleNewChat}
          style={{
            display: "flex", alignItems: "center", gap: 5, width: "100%",
            padding: "6px 10px", borderRadius: 5,
            background: "var(--proof-hover-light)", border: "1px dashed var(--proof-border)",
            cursor: "pointer", color: "var(--proof-text-secondary)", fontSize: 11, fontWeight: 600,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--proof-text)"; (e.currentTarget as HTMLElement).style.borderStyle = "solid"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--proof-hover-light)"; (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)"; (e.currentTarget as HTMLElement).style.borderStyle = "dashed"; }}
        >
          <Plus size={12} />
          <Bot size={12} />
          New Chat
        </button>
      </div>

      {/* Skills section */}
      <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--proof-border)" }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", color: "var(--proof-text-muted)", marginBottom: 6 }}>
          <Zap size={10} style={{ display: "inline", marginRight: 3, verticalAlign: "middle" }} />
          Skills
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                onClick={() => handleAction(a.message)}
                title={a.message}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 8px", borderRadius: 4,
                  border: "none", background: "transparent",
                  cursor: "pointer", fontSize: 11, fontWeight: 500,
                  color: "var(--proof-text-secondary)", textAlign: "left",
                  transition: "all 0.12s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = `${a.color}12`;
                  (e.currentTarget as HTMLElement).style.color = a.color;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)";
                }}
              >
                <Icon size={12} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.label}</span>
                <span style={{ fontSize: 8, opacity: 0.4, fontFamily: "var(--font-mono)" }}>{a.badge}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Provider info */}
      <div style={{ padding: "8px 10px", fontSize: 9, color: "var(--proof-text-muted)", lineHeight: 1.4 }}>
        <span style={{ fontWeight: 600 }}>AI Providers:</span> Chrome AI · WebLLM · OpenAI
      </div>
    </>
  );
}
