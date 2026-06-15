import React from "react";
import {
  Bot,
  Settings,
  Plus,
  Square,
  X,
  Loader2,
  Activity,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Shield,
  Flame,
  GitCompare,
  MessageSquare,
} from "lucide-react";
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
import type {
  Message,
  ProviderType,
  ProviderStatus,
  AgentEvent,
  SubAgentStep,
} from "@/lib/copilot/types";
import MessageFeed from "@/components/copilot/MessageFeed";
import InputBar from "@/components/copilot/InputBar";
import ProviderSelector from "@/components/copilot/ProviderSelector";
import { getLogs, subscribeLogs, clearLogs } from "@/lib/ai/debugLogger";
import type { DebugLogEntry } from "@/lib/ai/langGraphTypes";

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const QUICK_ACTIONS = [
  {
    id: "latest-runs",
    label: "Latest Runs",
    icon: <Activity size={12} />,
    color: "var(--proof-blue)",
    message: "Show me the last 10 test runs with pass rates and failure counts.",
  },
  {
    id: "flaky-tests",
    label: "Flaky Tests",
    icon: <RefreshCw size={12} />,
    color: "var(--proof-yellow)",
    message: "Which tests are flaky? Rank by flakiness score.",
  },
  {
    id: "trend-20",
    label: "20-Run Trend",
    icon: <TrendingUp size={12} />,
    color: "var(--proof-green)",
    message: "Show pass rate trend over the last 20 test runs.",
  },
  {
    id: "failure-analysis",
    label: "Analyze Failures",
    icon: <AlertTriangle size={12} />,
    color: "var(--proof-red)",
    message: "Analyze recent test failures and suggest root causes.",
  },
  {
    id: "promotion-status",
    label: "Promotion Readiness",
    icon: <Shield size={12} />,
    color: "var(--proof-purple)",
    message: "Is the UAT environment ready for promotion to PROD?",
  },
  {
    id: "top-flaky",
    label: "Top 15 Flaky",
    icon: <Flame size={12} />,
    color: "var(--proof-orange)",
    message: "Show the top 15 flakiest tests ranked by flakiness score.",
  },
  {
    id: "compare",
    label: "Compare Builds",
    icon: <GitCompare size={12} />,
    color: "var(--proof-cyan)",
    message: "Compare the two most recent test runs.",
  },
  {
    id: "anomalies",
    label: "Anomalies",
    icon: <Activity size={12} />,
    color: "var(--proof-pink)",
    message: "Detect anomalies in recent test runs.",
  },
];

const STARTER_PROMPTS = [
  { label: "What's failing?", message: "Show me all tests that failed in the latest run." },
  { label: "Trend analysis", message: "Analyze the pass rate trend over the last 20 runs." },
  { label: "Flakiness report", message: "Which tests are the flakiest? Rank them." },
  { label: "Promotion check", message: "Is UAT ready to promote to PROD?" },
  { label: "Compare runs", message: "Compare the two most recent test runs." },
  { label: "Health summary", message: "Summarize the current health of all environments." },
];

export default function CopilotPage() {
  const [messages, setMessages] = React.useState<Message[]>(() => {
    const session = loadSession();
    if (session?.messages?.length) return session.messages;
    return [
      {
        id: uid(),
        role: "assistant",
        content:
          "Hi! I'm the **AWARE Copilot**. I analyze test runs, detect failures, track flakiness, and check promotion readiness across your Akamai environments.\n\nChoose a starter question below, pick a quick action, or just ask me anything.",
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
    chrome: "unavailable",
  });
  const [downloadProgress, setDownloadProgress] = React.useState<{
    progress: number;
    text: string;
  } | null>(null);
  const [showSettings, setShowSettings] = React.useState(false);
  const [openaiConfig, setOpenaiConfig] = React.useState(loadOpenAIConfig);
  const [input, setInput] = React.useState("");
  const [debugLogs, setDebugLogs] = React.useState<DebugLogEntry[]>(() => getLogs());
  const [agentSteps, setAgentSteps] = React.useState<SubAgentStep[]>([]);
  const [showActions, setShowActions] = React.useState(false);
  const logEndRef = React.useRef<HTMLDivElement | null>(null);

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
    return { webllm: wllm, openai: createProvider("openai"), chrome: createProvider("chrome") };
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

  React.useEffect(() => {
    if (messages.length > 0) saveSession(messages, providerType);
  }, [messages, providerType]);

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

  const handleSend = React.useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || busy) return;
      if (!text) setInput("");

      const history = messages;
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

  const handleRetry = React.useCallback(
    (messageId: string) => {
      const idx = messages.findIndex((m) => m.id === messageId);
      if (idx < 0) return;
      let userIdx = idx - 1;
      while (userIdx >= 0 && messages[userIdx].role !== "user") userIdx--;
      if (userIdx < 0) return;
      const userContent = messages[userIdx].content;
      const slicedHistory = messages.slice(0, userIdx);
      if (!userContent.trim() || busy) return;

      const userMsg: Message = {
        id: uid(),
        role: "user",
        content: userContent,
        timestamp: Date.now(),
      };
      const assistantMsg: Message = {
        id: uid(),
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        streaming: true,
      };
      setMessages([...slicedHistory, userMsg, assistantMsg]);
      setBusy(true);

      const abort = new AbortController();
      abortRef.current = abort;

      runAgent({
        userContent,
        history: slicedHistory,
        provider: providers[providerType],
        tools: TOOLS,
        signal: abort.signal,
        onEvent: handleEvent,
      }).catch((err: unknown) => {
        if (!abort.signal.aborted) {
          handleEvent({
            type: "error",
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      });
    },
    [messages, busy, providers, providerType, handleEvent],
  );

  const handleStop = () => {
    abortRef.current?.abort();
    handleEvent({ type: "done" });
  };

  const handleProviderSwitch = (type: ProviderType) => {
    setProviderType(type);
    saveProviderType(type);
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

  const handleSaveSettings = (cfg: { apiKey: string; apiUrl: string; model: string }) => {
    setOpenaiConfig(cfg);
    saveOpenAIConfig(cfg);
    setShowSettings(false);
  };

  const isEmpty =
    messages.length === 1 && messages[0].role === "assistant" && !messages[0].streaming;

  return (
    <>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spin  { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        {/* ── Main area ── */}
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}
        >
          {/* ── Header ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 18px",
              borderBottom: "1px solid var(--proof-border)",
              flexShrink: 0,
              background: "var(--proof-surface)",
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                background: "var(--proof-blue-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--proof-blue)",
              }}
            >
              <Bot size={15} />
            </div>
            <div>
              <div
                role="heading"
                aria-level={1}
                style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}
              >
                AWARE Copilot
              </div>
              <div style={{ fontSize: 10, color: "var(--proof-text-secondary)", lineHeight: 1.3 }}>
                {providerType === "openai"
                  ? openaiConfig.model || "gpt-4o-mini"
                  : providerType === "webllm"
                    ? "WebLLM"
                    : "Chrome AI"}
              </div>
            </div>
            <div style={{ flex: 1 }} />

            <ProviderSelector
              providerType={providerType}
              providerStatus={providerStatus}
              downloadProgress={downloadProgress}
              onSwitch={handleProviderSwitch}
            />

            <button
              onClick={() => setShowActions((p) => !p)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "5px 10px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid var(--proof-border)",
                background: showActions ? "var(--proof-blue-bg)" : "var(--proof-surface-2)",
                color: showActions ? "var(--proof-blue)" : "var(--proof-text-secondary)",
              }}
            >
              <MessageSquare size={12} /> Actions
            </button>

            <button
              onClick={handleNewChat}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "5px 10px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid var(--proof-border)",
                background: "var(--proof-surface-2)",
                color: "var(--proof-text-secondary)",
              }}
            >
              <Plus size={12} /> New
            </button>

            <button
              onClick={() => setShowSettings((p) => !p)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "5px 10px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid var(--proof-border)",
                background: showSettings ? "var(--proof-blue-bg)" : "var(--proof-surface-2)",
                color: showSettings ? "var(--proof-blue)" : "var(--proof-text-secondary)",
              }}
            >
              <Settings size={12} />
            </button>

            {busy && (
              <button
                onClick={handleStop}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "5px 10px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid color-mix(in srgb, var(--proof-red) 25%, transparent)",
                  background: "var(--proof-surface-2)",
                  color: "var(--proof-red)",
                }}
              >
                <Square size={10} fill="currentColor" /> Stop
              </button>
            )}
          </div>

          {/* ── Settings inline panel ── */}
          {showSettings && (
            <div
              style={{
                borderBottom: "1px solid var(--proof-border)",
                padding: "12px 18px",
                background: "var(--proof-surface-2)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text)" }}>
                  OpenAI Settings
                </span>
                <button
                  onClick={() => setShowSettings(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    cursor: "pointer",
                    border: "1px solid var(--proof-border)",
                    background: "var(--proof-surface-2)",
                    color: "var(--proof-text-secondary)",
                  }}
                >
                  <X size={12} /> Close
                </button>
              </div>
              <SettingsForm config={openaiConfig} onSave={handleSaveSettings} />
            </div>
          )}

          {/* ── Quick actions bar (collapsible) ── */}
          {showActions && (
            <div
              style={{
                borderBottom: "1px solid var(--proof-border)",
                padding: "8px 16px",
                background: "var(--proof-surface-2)",
                flexShrink: 0,
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: "var(--proof-text-secondary)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  marginRight: 4,
                }}
              >
                Quick
              </span>
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setShowActions(false);
                    handleSend(a.message);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: "pointer",
                    border: `1px solid color-mix(in srgb, ${a.color} 30%, transparent)`,
                    background: `color-mix(in srgb, ${a.color} 8%, transparent)`,
                    color: a.color,
                    transition: "all 0.15s",
                  }}
                >
                  {a.icon} {a.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Message area ── */}
          <MessageFeed messages={messages} onRetry={handleRetry} />

          {/* ── Empty state / Starter prompts ── */}
          {isEmpty && !busy && (
            <div style={{ padding: "0 16px 12px", flexShrink: 0 }}>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--proof-text-secondary)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  marginBottom: 6,
                }}
              >
                Try asking
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {STARTER_PROMPTS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => handleSend(s.message)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      border: "1px solid var(--proof-border)",
                      background: "var(--proof-surface-2)",
                      color: "var(--proof-text)",
                      transition: "all 0.15s",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Agent steps indicator ── */}
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

          {/* ── Input bar ── */}
          <InputBar
            input={input}
            busy={busy}
            textareaRef={textareaRef}
            onSend={handleSend}
            onStop={handleStop}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            onInput={setInput}
          />
        </div>

        {/* ── Debug slide-over ── */}
        {debugLogs.length > 0 && (
          <div
            style={{
              width: 320,
              borderLeft: "1px solid var(--proof-border)",
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
              background: "var(--proof-surface)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                borderBottom: "1px solid var(--proof-border)",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--proof-text-secondary)",
              }}
            >
              <span>Debug Log ({debugLogs.length})</span>
              <button
                onClick={() => clearLogs()}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--proof-red)",
                  fontSize: 10,
                }}
              >
                Clear
              </button>
            </div>
            <div
              ref={logEndRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "6px 10px",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                lineHeight: 1.6,
              }}
            >
              {debugLogs.map((log, i) => (
                <div
                  key={i}
                  style={{
                    color:
                      log.level === "error"
                        ? "var(--proof-red)"
                        : log.level === "warn"
                          ? "var(--proof-yellow)"
                          : "var(--proof-text-secondary)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  <span style={{ opacity: 0.5 }}>{log.timestamp?.slice(11, 19) ?? ""}</span>{" "}
                  {log.event}
                  {log.details ? `: ${log.details}` : ""}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function SettingsForm({
  config,
  onSave,
}: {
  config: { apiKey: string; apiUrl: string; model: string };
  onSave: (cfg: { apiKey: string; apiUrl: string; model: string }) => void;
}) {
  const [apiKey, setApiKey] = React.useState(config.apiKey);
  const [apiUrl, setApiUrl] = React.useState(config.apiUrl);
  const [model, setModel] = React.useState(config.model);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: 6,
              border: "1px solid var(--proof-border)",
              background: "var(--proof-surface)",
              color: "var(--proof-text)",
              fontSize: 12,
              outline: "none",
              boxSizing: "border-box",
            }}
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
            API URL
          </label>
          <input
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://api.openai.com/v1"
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: 6,
              border: "1px solid var(--proof-border)",
              background: "var(--proof-surface)",
              color: "var(--proof-text)",
              fontSize: 12,
              outline: "none",
              boxSizing: "border-box",
            }}
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
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: 6,
              border: "1px solid var(--proof-border)",
              background: "var(--proof-surface)",
              color: "var(--proof-text)",
              fontSize: 12,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
        <span style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>
          Settings saved locally.
        </span>
      </div>
    </div>
  );
}
