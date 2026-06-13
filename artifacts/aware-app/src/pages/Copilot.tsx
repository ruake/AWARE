import React from "react";
import { AppLayout } from "@/components/aware/AppLayout";
import { Bot, Settings, Plus, Square, X, Loader2 } from "lucide-react";
import { TOOLS } from "@/lib/copilot/tools";
import { runAgent } from "@/lib/copilot/agent";
import { createProvider, WebLLMProvider } from "@/lib/copilot/providers";
import {
  loadSession,
  saveSession,
  clearSession,
  loadProviderType,
  saveProviderType,
  loadOpenAIConfig,
  saveOpenAIConfig,
} from "@/lib/copilot/storage";
import type { Message, ProviderType, ProviderStatus, AgentEvent, SubAgentStep } from "@/lib/copilot/types";
import MessageFeed from "@/components/copilot/MessageFeed";
import QuickActions from "@/components/copilot/QuickActions";
import InputBar from "@/components/copilot/InputBar";
import ProviderSelector from "@/components/copilot/ProviderSelector";
import DebugPanel from "@/components/copilot/DebugPanel";
import { getLogs, subscribeLogs, clearLogs } from "@/lib/ai/debugLogger";
import type { DebugLogEntry } from "@/lib/ai/langGraphTypes";

// ── uid helper ───────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ── button style helper ───────────────────────────────────────────────────────
const topBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 8px",
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
  border: "1px solid var(--proof-border)",
  background: "var(--proof-surface-2)",
  color: "var(--proof-text-secondary)",
};

// ── inline settings panel ─────────────────────────────────────────────────────
interface SettingsPanelProps {
  config: { apiKey: string; apiUrl: string; model: string };
  onSave: (cfg: { apiKey: string; apiUrl: string; model: string }) => void;
  onClose: () => void;
}

function SettingsPanel({ config, onSave, onClose }: SettingsPanelProps) {
  const [apiKey, setApiKey] = React.useState(config.apiKey);
  const [apiUrl, setApiUrl] = React.useState(config.apiUrl);
  const [model, setModel] = React.useState(config.model);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "6px 8px",
    borderRadius: 6,
    border: "1px solid var(--proof-border)",
    background: "var(--proof-surface)",
    color: "var(--proof-text)",
    fontSize: 12,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        borderBottom: "1px solid var(--proof-border)",
        padding: "12px 16px",
        background: "var(--proof-surface-2)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text)" }}>
          OpenAI Settings
        </span>
        <button onClick={onClose} style={{ ...topBtnStyle, padding: "2px 6px" }}>
          <X size={12} /> Close
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <div>
          <label
            style={{
              fontSize: 10,
              color: "var(--proof-text-secondary)",
              display: "block",
              marginBottom: 3,
            }}
          >
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            style={inputStyle}
          />
        </div>
        <div>
          <label
            style={{
              fontSize: 10,
              color: "var(--proof-text-secondary)",
              display: "block",
              marginBottom: 3,
            }}
          >
            API URL (optional)
          </label>
          <input
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://api.openai.com/v1"
            style={inputStyle}
          />
        </div>
        <div>
          <label
            style={{
              fontSize: 10,
              color: "var(--proof-text-secondary)",
              display: "block",
              marginBottom: 3,
            }}
          >
            Model
          </label>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="gpt-4o-mini"
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => onSave({ apiKey, apiUrl, model })}
          style={{
            padding: "5px 14px",
            borderRadius: 6,
            border: "none",
            background: "var(--proof-blue)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Save
        </button>
        <span style={{ fontSize: 10, color: "var(--proof-text-secondary)", alignSelf: "center" }}>
          Settings are saved locally to your browser only.
        </span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CopilotPage() {
  const [messages, setMessages] = React.useState<Message[]>(() => {
    const session = loadSession();
    return session?.messages?.length
      ? session.messages
      : [
          {
            id: uid(),
            role: "assistant",
            content:
              "Hi! I'm the **AWARE Copilot**. I call live data tools to answer questions about your test runs, failures, flakiness, and Akamai environment health.\n\nTry a Quick Action on the left, or just ask me anything.",
            timestamp: Date.now(),
          },
        ];
  });
  const [busy, setBusy] = React.useState(false);
  const [providerType, setProviderType] = React.useState<ProviderType>(() => {
    const session = loadSession();
    return session?.providerType ?? loadProviderType();
  });
  const [providerStatus, setProviderStatus] = React.useState<Record<ProviderType, ProviderStatus>>({
    webllm: "unavailable",
    openai: "available",
    chrome: "unavailable", // updated after async availability check
  });
  const [downloadProgress, setDownloadProgress] = React.useState<{
    progress: number;
    text: string;
  } | null>(null);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showDebug, setShowDebug] = React.useState(false);
  const [openaiConfig, setOpenaiConfig] = React.useState(loadOpenAIConfig);
  const [input, setInput] = React.useState("");
  const [debugLogs, setDebugLogs] = React.useState<DebugLogEntry[]>(() => getLogs());
  const [agentSteps, setAgentSteps] = React.useState<SubAgentStep[]>([]);
  const logEndRef = React.useRef<HTMLDivElement | null>(null);

  // Subscribe to debug logger updates
  React.useEffect(() => {
    const unsub = subscribeLogs(() => setDebugLogs([...getLogs()]));
    return unsub;
  }, []);

  const abortRef = React.useRef<AbortController | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const providers = React.useMemo(() => {
    const wllm = createProvider("webllm") as WebLLMProvider;
    wllm.onLoadProgress = (progress, text) => {
      setDownloadProgress({ progress, text });
      if (progress >= 1) setTimeout(() => setDownloadProgress(null), 2000);
    };
    return {
      webllm: wllm,
      openai: createProvider("openai"),
      chrome: createProvider("chrome"),
    };
  }, []);

  React.useEffect(() => {
    (async () => {
      const [webllmStatus, chromeStatus] = await Promise.all([
        providers.webllm.checkAvailability(),
        providers.chrome.checkAvailability(),
      ]);
      setProviderStatus((prev) => ({ ...prev, webllm: webllmStatus, chrome: chromeStatus }));
    })();
  }, [providers]);

  // Persist session whenever messages change
  React.useEffect(() => {
    if (messages.length > 0) saveSession(messages, providerType);
  }, [messages, providerType]);

  // ── Event handler (memoized — no deps change) ─────────────────────────────
  const handleEvent = React.useCallback((event: AgentEvent) => {
    switch (event.type) {
      case "delta":
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.streaming)
            return [...prev.slice(0, -1), { ...last, content: last.content + event.content }];
          return prev;
        });
        break;

      case "tool_start":
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.streaming)
            return [
              ...prev.slice(0, -1),
              { ...last, toolCalls: [...(last.toolCalls ?? []), event.toolCall] },
            ];
          return prev;
        });
        break;

      case "tool_done":
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.streaming && last.toolCalls)
            return [
              ...prev.slice(0, -1),
              {
                ...last,
                toolCalls: last.toolCalls.map((tc) =>
                  tc.id === event.toolCall.id ? event.toolCall : tc,
                ),
              },
            ];
          return prev;
        });
        break;

      case "step":
        setAgentSteps((prev) => [...prev.filter((s) => s.status !== "running"), event.step]);
        break;

      case "done":
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.streaming) return [...prev.slice(0, -1), { ...last, streaming: false }];
          return prev;
        });
        setBusy(false);
        setAgentSteps([]);
        abortRef.current = null;
        break;

      case "error":
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.streaming)
            return [
              ...prev.slice(0, -1),
              {
                ...last,
                streaming: false,
                error: event.error,
                content: last.content || "Something went wrong.",
              },
            ];
          return prev;
        });
        setBusy(false);
        abortRef.current = null;
        break;
    }
  }, []);

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = React.useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || busy) return;
      if (!text) setInput("");

      const history = messages; // capture before state update
      const userMsg: Message = { id: uid(), role: "user", content, timestamp: Date.now() };
      const assistantMsg: Message = {
        id: uid(),
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        streaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setBusy(true);

      const abort = new AbortController();
      abortRef.current = abort;

      try {
        await runAgent({
          userContent: content,
          history,
          provider: providers[providerType],
          tools: TOOLS,
          signal: abort.signal,
          onEvent: handleEvent,
        });
      } catch (err: unknown) {
        if (!abort.signal.aborted) {
          handleEvent({
            type: "error",
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
    },
    [busy, input, messages, providers, providerType, handleEvent],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    handleEvent({ type: "done" });
  };

  const handleProviderSwitch = (type: ProviderType) => {
    setProviderType(type);
    saveProviderType(type);
    setShowSettings(false);
  };

  const handleSaveSettings = (cfg: { apiKey: string; apiUrl: string; model: string }) => {
    setOpenaiConfig(cfg);
    saveOpenAIConfig(cfg);
    setShowSettings(false);
  };

  const handleNewChat = () => {
    abortRef.current?.abort();
    setMessages([
      {
        id: uid(),
        role: "assistant",
        content: "New chat started. What would you like to analyze?",
        timestamp: Date.now(),
      },
    ]);
    setBusy(false);
    clearSession();
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppLayout fullBleed>
      {/* Keyframe for blink cursor + spinner */}
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spin  { to{transform:rotate(360deg)} }
      `}</style>

      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* Quick actions sidebar */}
        <QuickActions onAction={handleSend} busy={busy} />

        {/* Main chat area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            minHeight: 0,
            borderLeft: "1px solid var(--proof-border)",
          }}
        >
          {/* Top bar — always visible */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderBottom: "1px solid var(--proof-border)",
              flexShrink: 0,
              background: "var(--proof-surface)",
              zIndex: 10,
            }}
          >
            <Bot size={15} style={{ color: "var(--proof-blue)" }} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>AWARE Copilot</span>
            <div style={{ flex: 1 }} />

            <ProviderSelector
              providerType={providerType}
              providerStatus={providerStatus}
              downloadProgress={downloadProgress}
              onSwitch={handleProviderSwitch}
            />

            <button onClick={() => setShowSettings((p) => !p)} style={topBtnStyle}>
              <Settings size={12} /> Settings
            </button>

            <button onClick={handleNewChat} style={topBtnStyle}>
              <Plus size={12} /> New Chat
            </button>

            <DebugPanel
              show={showDebug}
              logs={debugLogs}
              logEndRef={logEndRef}
              onToggle={() => setShowDebug((p) => !p)}
              onClear={() => clearLogs()}
            />

            {busy && (
              <button
                onClick={handleStop}
                style={{ ...topBtnStyle, color: "#ef4444", borderColor: "#ef444440" }}
              >
                <Square size={11} fill="currentColor" /> Stop
              </button>
            )}
          </div>

          {/* Settings panel (inline collapsible) */}
          {showSettings && (
            <SettingsPanel
              config={openaiConfig}
              onSave={handleSaveSettings}
              onClose={() => setShowSettings(false)}
            />
          )}

          {/* Message feed (virtualized) */}
          <MessageFeed messages={messages} />

          {/* Sub-agent steps indicator (LangGraph-style progress) */}
          {agentSteps.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 14px",
                borderTop: "1px solid var(--proof-border)",
                background: "var(--proof-surface-2)",
                fontSize: 11,
                color: "var(--proof-text-secondary)",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              <Loader2 size={10} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
              {agentSteps
                .filter((s) => s.status === "running" || s.status === "completed")
                .slice(-3)
                .map((s, i) => (
                  <React.Fragment key={s.id}>
                    {i > 0 && (
                      <span style={{ color: "var(--proof-border)", margin: "0 2px" }}>
                        {"\u2192"}
                      </span>
                    )}
                    <span
                      style={{
                        color:
                          s.status === "completed"
                            ? "var(--proof-text-secondary)"
                            : "var(--proof-text)",
                        fontWeight: s.status === "running" ? 600 : 400,
                      }}
                    >
                      {s.label}
                    </span>
                  </React.Fragment>
                ))}
            </div>
          )}

          {/* Input bar */}
          <InputBar
            input={input}
            busy={busy}
            textareaRef={textareaRef}
            onSend={handleSend}
            onKeyDown={handleKeyDown}
            onInput={setInput}
          />
        </div>
      </div>
    </AppLayout>
  );
}
