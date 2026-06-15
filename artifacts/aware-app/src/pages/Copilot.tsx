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
  Layers,
  Timer,
  Globe,
  GitCompare,
  Zap,
  ChevronDown,
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
import type { Message, ProviderType, ProviderStatus, AgentEvent, SubAgentStep } from "@/lib/copilot/types";
import MessageFeed from "@/components/copilot/MessageFeed";
import InputBar from "@/components/copilot/InputBar";
import ProviderSelector from "@/components/copilot/ProviderSelector";
import { getLogs, subscribeLogs } from "@/lib/ai/debugLogger";
import type { DebugLogEntry } from "@/lib/ai/langGraphTypes";

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ── 8 Distinct Quick Actions — one per tool ──────────────────────────────────
const QUICK_ACTIONS = [
  {
    id: "latest-runs",
    label: "Latest Runs",
    icon: Activity,
    color: "#3b82f6",
    badge: "query_runs",
    message: "Show me the last 15 test runs with pass rates, failure counts, and environments as a table.",
  },
  {
    id: "flaky-tests",
    label: "Flaky Tests",
    icon: RefreshCw,
    color: "#f59e0b",
    badge: "get_flaky_tests",
    message: "Which tests are flaky? Rank them by flakiness score and show the PASS/FAIL flip sequence.",
  },
  {
    id: "env-compare",
    label: "Env Compare",
    icon: GitCompare,
    color: "#8b5cf6",
    badge: "compare_environments",
    message: "Compare QA, UAT, and PROD environments — show avg pass rates, total failures, and health status.",
  },
  {
    id: "promotion-gate",
    label: "Promo Gate",
    icon: Shield,
    color: "#10b981",
    badge: "get_promotion_status",
    message: "Show UAT→PROD promotion gate status — how many decisions promoted, blocked, or pending?",
  },
  {
    id: "failure-breakdown",
    label: "Failure Root Cause",
    icon: AlertTriangle,
    color: "#ef4444",
    badge: "get_failure_breakdown",
    message: "Break down failures in the latest run by category (WAF, TLS, API, EdgeWorker). Show which area has the most failures.",
  },
  {
    id: "suite-health",
    label: "Suite Health",
    icon: Layers,
    color: "#06b6d4",
    badge: "get_suite_health",
    message: "Show pass rates and failure counts for all test suites. Which suite is struggling?",
  },
  {
    id: "duration-trends",
    label: "Duration Trends",
    icon: Timer,
    color: "#ec4899",
    badge: "get_duration_trends",
    message: "Show execution duration trends across the last 10 runs. Are there any timing regressions?",
  },
  {
    id: "akamai-property",
    label: "Akamai Status",
    icon: Globe,
    color: "#f97316",
    badge: "get_akamai_property",
    message: "Show Akamai property versions, EdgeWorker versions, PoP counts, and activation status for all environments.",
  },
];

// ── Settings form ─────────────────────────────────────────────────────────────
function SettingsForm({ config, onSave }: { config: { apiKey: string; apiUrl: string; model: string }; onSave: (cfg: { apiKey: string; apiUrl: string; model: string }) => void }) {
  const [apiKey, setApiKey] = React.useState(config.apiKey);
  const [apiUrl, setApiUrl] = React.useState(config.apiUrl);
  const [model, setModel] = React.useState(config.model);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 11, color: "var(--proof-text-secondary)", fontWeight: 600 }}>API Key</label>
        <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..." className="proof-input" style={{ fontSize: 12 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 11, color: "var(--proof-text-secondary)", fontWeight: 600 }}>API URL</label>
        <input value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="https://api.openai.com/v1" className="proof-input" style={{ fontSize: 12 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 11, color: "var(--proof-text-secondary)", fontWeight: 600 }}>Model</label>
        <input value={model} onChange={e => setModel(e.target.value)} placeholder="gpt-4o-mini" className="proof-input" style={{ fontSize: 12 }} />
      </div>
      <button onClick={() => onSave({ apiKey, apiUrl, model })} className="proof-button-primary" style={{ alignSelf: "flex-end", padding: "6px 16px", fontSize: 12 }}>
        Save Settings
      </button>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onSend }: { onSend: (msg: string) => void }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 24px", gap: 28,
      animation: "fade-in 0.4s ease-out both",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.15))",
          border: "1px solid rgba(59,130,246,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 32px rgba(59,130,246,0.15), 0 8px 32px rgba(0,0,0,0.4)",
        }}>
          <Bot size={30} style={{ color: "#60a5fa" }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--proof-text)", margin: "0 0 6px", letterSpacing: "-0.5px" }}>
            A.W.A.R.E. Copilot
          </h2>
          <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", margin: 0, lineHeight: 1.6, maxWidth: 420, textAlign: "center" }}>
            LangGraph-powered AI · 8 analytics tools · live tables &amp; charts · Chrome AI / WebLLM / OpenAI
          </p>
        </div>
      </div>

      {/* Feature cards — one per tool category */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, maxWidth: 560, width: "100%" }}>
        {[
          { icon: Activity,      color: "#3b82f6", label: "Run History",    desc: "Trends & pass rates" },
          { icon: RefreshCw,     color: "#f59e0b", label: "Flakiness",      desc: "PASS↔FAIL instability" },
          { icon: Shield,        color: "#10b981", label: "Promo Gate",     desc: "UAT→PROD decisions" },
          { icon: AlertTriangle, color: "#ef4444", label: "Root Cause",     desc: "Failure by category" },
          { icon: GitCompare,    color: "#8b5cf6", label: "Env Comparison", desc: "QA / UAT / PROD" },
          { icon: Layers,        color: "#06b6d4", label: "Suite Health",   desc: "Per-suite metrics" },
          { icon: Timer,         color: "#ec4899", label: "Duration",       desc: "Timing regressions" },
          { icon: Globe,         color: "#f97316", label: "Akamai CDN",     desc: "Property & EW status" },
        ].map(({ icon: Icon, color, label, desc }) => (
          <div key={label} style={{
            padding: "10px 12px",
            background: "var(--proof-surface)",
            border: "1px solid var(--proof-border)",
            borderRadius: 9,
            display: "flex", flexDirection: "column", gap: 5,
            transition: "border-color 0.15s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 5,
                background: `color-mix(in srgb, ${color} 15%, transparent)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={11} style={{ color }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--proof-text)" }}>{label}</span>
            </div>
            <p style={{ fontSize: 10.5, color: "var(--proof-text-muted)", margin: 0, lineHeight: 1.45 }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Starter prompts */}
      <div style={{ maxWidth: 580, width: "100%" }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 10, textAlign: "center" }}>
          Try asking
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center" }}>
          {[
            "What's failing in the latest run?",
            "Show pass rate trend over 15 runs",
            "Which tests are flakiest?",
            "Is UAT ready to promote to PROD?",
            "Compare suite health across environments",
            "Are there any duration regressions?",
            "What's the Akamai property version in PROD?",
            "Summarize all environment health",
          ].map(prompt => (
            <button
              key={prompt}
              onClick={() => onSend(prompt)}
              className="copilot-quick-chip"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CopilotPage() {
  const [messages, setMessages] = React.useState<Message[]>(() => {
    const session = loadSession();
    if (session?.messages?.length) return session.messages;
    return [];
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
  const [downloadProgress, setDownloadProgress] = React.useState<{ progress: number; text: string } | null>(null);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showActions, setShowActions] = React.useState(false);
  const [openaiConfig, setOpenaiConfig] = React.useState(loadOpenAIConfig);
  const [input, setInput] = React.useState("");
  const [agentSteps, setAgentSteps] = React.useState<SubAgentStep[]>([]);
  const [debugLogs, setDebugLogs] = React.useState<DebugLogEntry[]>(() => getLogs());

  React.useEffect(() => {
    const unsub = subscribeLogs(() => setDebugLogs([...getLogs()]));
    return unsub;
  }, []);

  const abortRef = React.useRef<AbortController | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const providers = React.useMemo(() => {
    const wllm = createProvider("webllm") as WebLLMProvider;
    wllm.onLoadProgress = (progress: number, text: string) => {
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
      setProviderStatus(prev => ({ ...prev, webllm: webllmStatus, chrome: chromeStatus }));
    })();
  }, [providers]);

  React.useEffect(() => {
    if (messages.length > 0) saveSession(messages, providerType);
  }, [messages, providerType]);

  // ── Event handler (handles all 7 AgentEvent types incl. graph_node) ─────────
  const handleEvent = React.useCallback((event: AgentEvent) => {
    switch (event.type) {
      case "delta":
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.streaming) return [...prev.slice(0, -1), { ...last, content: last.content + event.content }];
          return prev;
        });
        break;

      case "tool_start":
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.streaming) return [...prev.slice(0, -1), { ...last, toolCalls: [...(last.toolCalls ?? []), event.toolCall] }];
          return prev;
        });
        break;

      case "tool_done":
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.streaming && last.toolCalls)
            return [...prev.slice(0, -1), { ...last, toolCalls: last.toolCalls.map(tc => tc.id === event.toolCall.id ? event.toolCall : tc) }];
          return prev;
        });
        break;

      case "graph_node":
        // Merge updated node state into the last assistant message
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (!last?.streaming) return prev;
          const existingNodes = last.graphNodes ?? [];
          const idx = existingNodes.findIndex(n => n.id === event.node.id);
          const updatedNodes = idx >= 0
            ? existingNodes.map((n, i) => i === idx ? event.node : n)
            : [...existingNodes, event.node];
          return [...prev.slice(0, -1), { ...last, graphNodes: updatedNodes }];
        });
        break;

      case "step":
        setAgentSteps(prev => {
          const filtered = prev.filter(s => s.id !== event.step.id);
          return [...filtered, event.step];
        });
        break;

      case "done":
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.streaming) return [...prev.slice(0, -1), { ...last, streaming: false }];
          return prev;
        });
        setBusy(false);
        setAgentSteps([]);
        abortRef.current = null;
        break;

      case "error":
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.streaming)
            return [...prev.slice(0, -1), { ...last, streaming: false, error: event.error, content: last.content || "Something went wrong." }];
          return prev;
        });
        setBusy(false);
        abortRef.current = null;
        break;
    }
  }, []);

  const handleSend = React.useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    if (!text) setInput("");

    const history = messages;
    const userMsg: Message = { id: uid(), role: "user", content, timestamp: Date.now() };
    const assistantMsg: Message = {
      id: uid(), role: "assistant", content: "",
      timestamp: Date.now(), streaming: true,
      graphNodes: [],
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
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
      if (!abort.signal.aborted) handleEvent({ type: "error", error: err instanceof Error ? err.message : "Unknown error" });
    }
  }, [busy, input, messages, providers, providerType, handleEvent]);

  const handleRetry = React.useCallback((messageId: string) => {
    const idx = messages.findIndex(m => m.id === messageId);
    if (idx < 0) return;
    let userIdx = idx - 1;
    while (userIdx >= 0 && messages[userIdx].role !== "user") userIdx--;
    if (userIdx < 0) return;
    const userContent = messages[userIdx].content;
    const slicedHistory = messages.slice(0, userIdx);
    if (!userContent.trim() || busy) return;

    const userMsg: Message = { id: uid(), role: "user", content: userContent, timestamp: Date.now() };
    const assistantMsg: Message = { id: uid(), role: "assistant", content: "", timestamp: Date.now(), streaming: true, graphNodes: [] };
    setMessages([...slicedHistory, userMsg, assistantMsg]);
    setBusy(true);

    const abort = new AbortController();
    abortRef.current = abort;
    runAgent({ userContent, history: slicedHistory, provider: providers[providerType], tools: TOOLS, signal: abort.signal, onEvent: handleEvent })
      .catch((err: unknown) => { if (!abort.signal.aborted) handleEvent({ type: "error", error: err instanceof Error ? err.message : "Unknown error" }); });
  }, [messages, busy, providers, providerType, handleEvent]);

  const handleStop = () => { abortRef.current?.abort(); handleEvent({ type: "done" }); };
  const handleProviderSwitch = (type: ProviderType) => { setProviderType(type); saveProviderType(type); setShowSettings(false); };
  const handleNewChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setBusy(false);
    clearSession();
    setShowSettings(false);
    setShowActions(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };
  const handleSaveSettings = (cfg: { apiKey: string; apiUrl: string; model: string }) => {
    setOpenaiConfig(cfg);
    saveOpenAIConfig(cfg);
    setShowSettings(false);
  };

  const isEmpty = messages.length === 0;

  // Suppress unused variable warning
  void debugLogs;

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0, height: "100%" }}>
      {/* ── Main column ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, position: "relative" }}>

        {/* ── Topbar ─────────────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 16px",
          borderBottom: "1px solid var(--proof-border)",
          background: "rgba(10, 22, 40, 0.8)",
          backdropFilter: "blur(20px)",
          flexShrink: 0, zIndex: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.1))",
            border: "1px solid rgba(59,130,246,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 12px rgba(59,130,246,0.15)",
          }}>
            <Bot size={16} style={{ color: "#60a5fa" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.2px", color: "var(--proof-text)" }}>A.W.A.R.E. Copilot</div>
            <div style={{ fontSize: 10, color: "var(--proof-text-muted)", lineHeight: 1.2 }}>
              LangGraph · 8 tools ·{" "}
              {providerType === "openai" ? (openaiConfig.model || "gpt-4o-mini") : providerType === "webllm" ? "WebLLM · Llama-3.2" : "Chrome AI · Gemini Nano"}
            </div>
          </div>

          {/* Provider selector */}
          <ProviderSelector
            providerType={providerType}
            providerStatus={providerStatus}
            downloadProgress={downloadProgress}
            onSwitch={handleProviderSwitch}
          />

          {/* Quick actions toggle */}
          <button
            onClick={() => setShowActions(p => !p)}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "5px 10px", borderRadius: 7,
              fontSize: 11.5, fontWeight: 600, cursor: "pointer",
              border: "1px solid var(--proof-border)",
              background: showActions ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.03)",
              color: showActions ? "var(--proof-blue-bright)" : "var(--proof-text-secondary)",
              transition: "all 0.15s",
            }}
          >
            <Zap size={11} /> Quick Actions
            <ChevronDown size={10} style={{ transform: showActions ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
          </button>

          {/* New chat */}
          <button
            onClick={handleNewChat}
            title="New chat"
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "5px 10px", borderRadius: 7,
              fontSize: 11.5, fontWeight: 600, cursor: "pointer",
              border: "1px solid var(--proof-border)",
              background: "rgba(255,255,255,0.03)",
              color: "var(--proof-text-secondary)",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "var(--proof-text)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)"; }}
          >
            <Plus size={12} /> New Chat
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(p => !p)}
            title="Settings"
            style={{
              padding: "6px 7px", borderRadius: 7, cursor: "pointer",
              border: "1px solid var(--proof-border)",
              background: showSettings ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.03)",
              color: showSettings ? "var(--proof-blue-bright)" : "var(--proof-text-secondary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}
          >
            <Settings size={14} />
          </button>

          {/* Stop */}
          {busy && (
            <button
              onClick={handleStop}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "5px 10px", borderRadius: 7,
                fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                border: "1px solid rgba(248,113,113,0.25)",
                background: "rgba(239,68,68,0.08)", color: "#f87171",
                transition: "all 0.15s",
              }}
            >
              <Square size={10} fill="currentColor" /> Stop
            </button>
          )}
        </div>

        {/* ── Settings panel ─────────────────────────────────────────────────── */}
        {showSettings && (
          <div style={{
            borderBottom: "1px solid var(--proof-border)",
            padding: "14px 18px",
            background: "rgba(10,22,40,0.6)",
            backdropFilter: "blur(10px)",
            flexShrink: 0,
            animation: "slide-down 0.15s ease-out",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--proof-text)" }}>OpenAI Settings</span>
              <button onClick={() => setShowSettings(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--proof-text-muted)", display: "flex", alignItems: "center" }}><X size={14} /></button>
            </div>
            <SettingsForm config={openaiConfig} onSave={handleSaveSettings} />
          </div>
        )}

        {/* ── Quick actions strip — 8 distinct tool actions ─────────────────── */}
        {showActions && (
          <div style={{
            borderBottom: "1px solid var(--proof-border)",
            padding: "10px 16px",
            background: "rgba(10,22,40,0.5)",
            flexShrink: 0,
            display: "flex", gap: 6, flexWrap: "wrap",
            animation: "slide-down 0.15s ease-out",
          }}>
            {QUICK_ACTIONS.map(a => {
              const Icon = a.icon;
              return (
                <button
                  key={a.id}
                  onClick={() => { setShowActions(false); handleSend(a.message); }}
                  title={a.message}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 11px", borderRadius: 18,
                    fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                    border: `1px solid color-mix(in srgb, ${a.color} 28%, transparent)`,
                    background: `color-mix(in srgb, ${a.color} 9%, transparent)`,
                    color: a.color,
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `color-mix(in srgb, ${a.color} 16%, transparent)`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `color-mix(in srgb, ${a.color} 9%, transparent)`; }}
                >
                  <Icon size={11} />
                  {a.label}
                  <span style={{
                    fontSize: 8.5, fontFamily: "var(--font-mono)",
                    color: `color-mix(in srgb, ${a.color} 60%, transparent)`,
                    marginLeft: 2,
                  }}>
                    {a.badge}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Running step strip (shows classify/plan/execute/synthesize) ──── */}
        {agentSteps.length > 0 && busy && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "5px 16px",
            borderBottom: "1px solid var(--proof-border)",
            background: "rgba(59,130,246,0.04)",
            fontSize: 10.5, color: "var(--proof-text-muted)", flexShrink: 0,
          }}>
            <Loader2 size={9} style={{ animation: "spin 0.8s linear infinite", color: "#60a5fa", flexShrink: 0 }} />
            {agentSteps.slice(-4).map((s, i) => (
              <React.Fragment key={s.id}>
                {i > 0 && <span style={{ color: "rgba(255,255,255,0.12)" }}>·</span>}
                <span style={{
                  color: s.status === "completed" ? "#34d399" : s.status === "running" ? "#60a5fa" : "var(--proof-text-muted)",
                  fontWeight: s.status === "running" ? 600 : 400,
                  fontFamily: "var(--font-mono)",
                }}>
                  {s.label}
                  {s.detail ? ` (${s.detail})` : ""}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* ── Messages / Empty state ─────────────────────────────────────────── */}
        {isEmpty && !busy ? (
          <EmptyState onSend={handleSend} />
        ) : (
          <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0, flexDirection: "column" }}>
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <MessageFeed messages={messages} onRetry={handleRetry} />
            </div>
          </div>
        )}

        {/* ── Download progress ─────────────────────────────────────────────── */}
        {downloadProgress && (
          <div style={{
            padding: "8px 18px", borderTop: "1px solid var(--proof-border)",
            background: "rgba(59,130,246,0.05)",
            flexShrink: 0, display: "flex", flexDirection: "column", gap: 6,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "var(--proof-blue-bright)" }}>
              <span style={{ fontWeight: 600 }}>Loading WebLLM model…</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>{Math.round((downloadProgress.progress ?? 0) * 100)}%</span>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.round((downloadProgress.progress ?? 0) * 100)}%`, background: "linear-gradient(90deg, #2563eb, #3b82f6)", borderRadius: 99, transition: "width 0.3s" }} />
            </div>
            <div style={{ fontSize: 10, color: "var(--proof-text-muted)" }}>{downloadProgress.text}</div>
          </div>
        )}

        {/* ── Input bar ─────────────────────────────────────────────────────── */}
        <div style={{ maxWidth: 860, width: "100%", alignSelf: "center", flexShrink: 0, paddingBottom: 4 }}>
          <InputBar
            input={input}
            busy={busy}
            textareaRef={textareaRef}
            onSend={() => handleSend()}
            onStop={handleStop}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            onInput={setInput}
          />
        </div>
      </div>
    </div>
  );
}
