import React from "react";
import { AppLayout } from "@/components/aware/AppLayout";
import {
  Send,
  Bot,
  User,
  AlertCircle,
  Zap,
  Bug,
  TrendingUp,
  Shield,
  Layers,
  LineChart,
  Activity,
  Search,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
  Cpu,
  Globe,
  Settings,
  Loader2,
} from "lucide-react";
import {
  AI_USE_CASES,
  runAnalysis,
  runFallbackAnalysis,
  generateInsights,
  buildAIContext,
  buildSystemPrompt,
} from "@/lib/ai";
import type { AIInsight, AIUseCase } from "@/lib/ai";
import { getProvider, getLLMConfig, setLLMConfig } from "@/lib/llm";
import { RUNS } from "@/lib/runs";
import type { LLMProviderType } from "@/lib/types";
import { checkWebLLM, checkChromeAI } from "@/lib/llm";
import { Markdown } from "@/components/aware/Markdown";

const USE_CASE_ICONS: Record<string, React.ReactNode> = {
  "failure-analysis": <Bug size={14} />,
  "flaky-detection": <Activity size={14} />,
  "regression-prediction": <TrendingUp size={14} />,
  "performance-trends": <LineChart size={14} />,
  "anomaly-detection": <AlertCircle size={14} />,
  "root-cause-analysis": <Search size={14} />,
  "risk-scoring": <Shield size={14} />,
  "category-health": <Activity size={14} />,
  "env-comparison": <Layers size={14} />,
  "build-risk-assessment": <Shield size={14} />,
};

const PROCESSING_MESSAGES = [
  "Analyzing test data…",
  "Querying runs…",
  "Computing statistics…",
  "Generating insights…",
  "Crunching numbers…",
  "Scanning results…",
  "Building response…",
  "Checking correlations…",
  "Evaluating trends…",
  "Almost there…",
];

const PROVIDER_META: Record<
  LLMProviderType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  openai: { label: "OpenAI", icon: <Globe size={12} />, color: "#10a37f" },
  webllm: { label: "WebLLM", icon: <Cpu size={12} />, color: "#8b5cf6" },
  chrome: { label: "Chrome AI", icon: <Zap size={12} />, color: "#4285f4" },
};

async function probeProvider(type: LLMProviderType): Promise<boolean> {
  try {
    if (type === "webllm") return checkWebLLM();
    if (type === "chrome") return checkChromeAI();
    if (type === "openai") {
      const cfg = getLLMConfig();
      if (!cfg.apiKey) return false;
      const prov = getProvider();
      return prov.testConnection();
    }
    return false;
  } catch {
    return false;
  }
}

export default function Copilot() {
  const [activeUseCase, setActiveUseCase] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<
    { role: string; content: string; type?: string }[]
  >([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [aiReady, setAiReady] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [insights, setInsights] = React.useState<AIInsight[]>([]);
  const [usingFallback, setUsingFallback] = React.useState(false);
  const [providerAvail, setProviderAvail] = React.useState<Record<string, boolean>>({});
  const [expandedMsgs, setExpandedMsgs] = React.useState<Set<number>>(new Set());
  const [showProviderMenu, setShowProviderMenu] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [settingsApiKey, setSettingsApiKey] = React.useState("");
  const [settingsApiUrl, setSettingsApiUrl] = React.useState("");
  const [settingsModel, setSettingsModel] = React.useState("");
  const [settingsSaved, setSettingsSaved] = React.useState(false);
  const [thinkingMsg, setThinkingMsg] = React.useState(PROCESSING_MESSAGES[0]);
  const providerRef = React.useRef<HTMLDivElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const cfg = getLLMConfig();
  const currentProvider = cfg.provider;

  const probeAllProviders = React.useCallback(async () => {
    const results: Record<string, boolean> = {};
    for (const type of ["openai", "webllm", "chrome"] as LLMProviderType[]) {
      results[type] = await probeProvider(type);
    }
    setProviderAvail(results);
    return results;
  }, []);

  const init = React.useCallback(async () => {
    try {
      const ctx = buildAIContext();
      const [insightsList, avail] = await Promise.all([generateInsights(), probeAllProviders()]);
      setInsights(insightsList);
      const currentOk = avail[currentProvider] ?? false;
      setAiReady(currentOk);
      setUsingFallback(!currentOk);
      const lastRun = [...RUNS].sort(
        (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
      )[0];
      setMessages([
        {
          role: "assistant",
          content: `Hello! I'm **PROOF Copilot** — analyzing **${ctx.stats.totalRuns} runs** across **${ctx.stats.totalSuites} suites** with **${ctx.stats.totalTests} tests** (avg ${ctx.stats.avgPassRate}% pass rate).\n\n**Provider:** ${PROVIDER_META[currentProvider].label} — ${currentOk ? "✅ Connected" : "❌ Unavailable"}${currentOk ? "" : "\n\n> Switch providers using the dropdown above, or configure an API key."}\n\n### Latest Run: \`${lastRun?.id}\`\n\n| Detail | Value |\n|--------|-------|\n| Label | ${lastRun?.label} |\n| Status | **${lastRun?.status}** |\n| Pass Rate | ${lastRun?.passPct}% |\n| Failures | ${lastRun?.failures} |\n| Duration | ${lastRun?.duration} |\n| Environment | ${lastRun?.env} / ${lastRun?.target} |\n| Build | \`${lastRun?.build}\` |\n\nSelect an analysis type from the sidebar or ask a question.`,
          type: "intro",
        },
      ]);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [currentProvider, probeAllProviders]);

  React.useEffect(() => {
    init();
  }, [init]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cycle processing messages when busy
  React.useEffect(() => {
    if (!busy) {
      setThinkingMsg(PROCESSING_MESSAGES[0]);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % PROCESSING_MESSAGES.length;
      setThinkingMsg(PROCESSING_MESSAGES[i]);
    }, 1800);
    return () => clearInterval(interval);
  }, [busy]);

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (providerRef.current && !providerRef.current.contains(e.target as Node)) {
        setShowProviderMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Sync settings form from current config when panel opens
  React.useEffect(() => {
    if (showSettings) {
      const c = getLLMConfig();
      setSettingsApiKey(c.apiKey ?? "");
      setSettingsApiUrl(c.apiUrl ?? "");
      setSettingsModel(c.model ?? "");
    }
  }, [showSettings]);

  const handleSaveSettings = async () => {
    setLLMConfig({
      provider: "openai",
      apiKey: settingsApiKey.trim(),
      apiUrl: settingsApiUrl.trim() || undefined,
      model: settingsModel.trim() || "gpt-4o-mini",
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
    setShowSettings(false);
    setLoading(true);
    setMessages([]);
    setActiveUseCase(null);
    setTimeout(() => init(), 0);
  };

  const switchProvider = async (type: LLMProviderType) => {
    setShowProviderMenu(false);
    setLoading(true);
    setLLMConfig({ provider: type });
    setMessages([]);
    setActiveUseCase(null);
    // re-init with new provider
    setTimeout(() => init(), 0);
  };

  const handleUseCase = async (useCase: AIUseCase) => {
    setActiveUseCase(useCase.id);
    setMessages((prev) => [...prev, { role: "user", content: useCase.name, type: "use-case" }]);
    setBusy(true);
    try {
      // Use the real LLM when available; runAnalysis falls back internally if the provider fails
      const result = aiReady
        ? await runAnalysis({ useCaseId: useCase.id, parameters: {} })
        : runFallbackAnalysis({ useCaseId: useCase.id, parameters: {} });
      const resultText = result.details || result.summary;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: resultText, type: "analysis" },
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err.message}`, type: "error" },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || busy) return;
    const userMsg = input.trim();
    // Snapshot current messages synchronously before any state updates
    const priorMessages = messages;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg, type: "text" }]);
    setBusy(true);
    try {
      const provider = getProvider();
      let response: string;
      try {
        const ctx = buildAIContext();
        const systemPrompt = buildSystemPrompt(ctx);
        // Build full conversation history: system + prior exchanges + new user msg
        const historyMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
          { role: "system", content: systemPrompt },
          ...priorMessages
            .filter((m) => m.role === "user" || m.role === "assistant")
            .filter((m) => m.type !== "intro")
            .slice(-12) // keep last 6 turns (12 messages)
            .map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
          { role: "user", content: userMsg },
        ];
        const completion = await provider.complete({
          messages: historyMessages,
          temperature: 0.3,
          maxTokens: 8192,
        });
        response = completion.content;
      } catch {
        // Offline fallback: answer from data directly
        const ctx = buildAIContext();
        const lastRun = [...RUNS].sort(
          (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
        )[0];
        response = `**Offline mode** — no LLM provider available. Here's what the data says:\n\n- **${ctx.stats.totalRuns} runs** | avg pass rate **${ctx.stats.avgPassRate}%** | **${ctx.stats.totalFailures}** total failures\n- Environments: ${ctx.stats.envs.join(", ")}\n- ${ctx.testCoverage}\n- ${ctx.promotionStatus}\n\n**Latest run:** \`${lastRun?.id}\` — "${lastRun?.label}"\n  Status: **${lastRun?.status}** | Pass rate: ${lastRun?.passPct}% | Failures: ${lastRun?.failures} | Build: \`${lastRun?.build}\`\n\nSwitch to a working provider in the dropdown above for AI-generated answers.`;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: response, type: "chat" }]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err.message}`, type: "error" },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleExpand = (i: number) => {
    setExpandedMsgs((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const MAX_PREVIEW = 2000;

  if (loading) {
    return (
      <AppLayout activeHref="/copilot">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
          }}
        >
          <div className="proof-skeleton" style={{ width: 36, height: 36, borderRadius: "50%" }} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeHref="/copilot">
      <div style={{ display: "flex", height: "calc(100vh - 96px)", gap: 16 }}>
        <div
          style={{
            width: 228,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            overflowY: "auto",
            paddingRight: 4,
            borderRight: "1px solid var(--proof-border)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--proof-text-muted)",
              padding: "10px 8px 6px",
            }}
          >
            Analysis Types
          </div>
          {AI_USE_CASES.map((uc) => {
            const isActive = activeUseCase === uc.id;
            return (
              <button
                key={uc.id}
                onClick={() => handleUseCase(uc)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 9,
                  padding: "8px 10px",
                  borderRadius: 7,
                  fontSize: 12,
                  cursor: "pointer",
                  border: isActive ? "1px solid rgba(91,138,245,0.35)" : "1px solid transparent",
                  background: isActive
                    ? "linear-gradient(135deg, rgba(91,138,245,0.12) 0%, rgba(124,106,245,0.08) 100%)"
                    : "transparent",
                  color: isActive ? "var(--proof-blue)" : "var(--proof-text)",
                  textAlign: "left",
                  transition: "all 0.15s",
                  borderLeft: isActive ? "2px solid var(--proof-blue)" : "2px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "var(--proof-surface-2)";
                    e.currentTarget.style.borderLeft = "2px solid var(--proof-border-strong)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderLeft = "2px solid transparent";
                  }
                }}
                title={uc.description}
              >
                <span style={{ flexShrink: 0, marginTop: 1, opacity: isActive ? 1 : 0.7 }}>
                  {USE_CASE_ICONS[uc.id] || <Zap size={13} />}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontWeight: isActive ? 600 : 500, lineHeight: 1.3, fontSize: 12 }}>
                    {uc.name}
                  </span>
                  <span style={{ display: "block", fontSize: 10, color: "var(--proof-text-muted)", lineHeight: 1.4, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {uc.description}
                  </span>
                </span>
              </button>
            );
          })}
          {insights.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--proof-text-muted)",
                  padding: "14px 8px 6px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#ef4444",
                    display: "inline-block",
                    boxShadow: "0 0 6px rgba(239,68,68,0.6)",
                  }}
                />
                Live Insights
              </div>
              {insights.map((ins) => {
                const accent = ins.type === "critical" ? "#ef4444" : ins.type === "warning" ? "#f59e0b" : "#22c55e";
                return (
                  <div
                    key={ins.id}
                    style={{
                      padding: "9px 10px 9px 12px",
                      borderRadius: 7,
                      fontSize: 11,
                      background: `${accent}0a`,
                      border: `1px solid ${accent}20`,
                      borderLeft: `3px solid ${accent}`,
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 2, fontSize: 11, color: "var(--proof-text)" }}>{ins.title}</div>
                    <div style={{ color: "var(--proof-text-secondary)", fontSize: 10, lineHeight: 1.4 }}>{ins.description}</div>
                  </div>
                );
              })}
            </>
          )}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Provider selector bar */}
          <div
            ref={providerRef}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              marginBottom: 8,
              background: "var(--proof-grey-bg)",
              border: "1px solid var(--proof-grey)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              position: "relative",
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                background: "var(--proof-yellow)",
                color: "var(--proof-surface)",
                padding: "1px 6px",
                borderRadius: 3,
              }}
            >
              Experimental
            </span>
            <Settings size={13} style={{ color: "var(--proof-text-secondary)", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "var(--proof-text-secondary)", fontWeight: 500 }}>
              LLM Provider:
            </span>
            <button
              onClick={() => setShowProviderMenu((p) => !p)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 10px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid var(--proof-grey)",
                background: "var(--proof-surface)",
                color: "var(--proof-text)",
              }}
            >
              {PROVIDER_META[currentProvider].icon}
              {PROVIDER_META[currentProvider].label}
              {aiReady ? (
                <Wifi size={11} style={{ color: "#22c55e" }} />
              ) : (
                <WifiOff size={11} style={{ color: "#ef4444" }} />
              )}
            </button>
            <span style={{ fontSize: 10, color: aiReady ? "#22c55e" : "#ef4444", fontWeight: 500 }}>
              {aiReady ? "Connected" : "Unavailable"}
            </span>
            <button
              onClick={() => { setShowProviderMenu(false); setShowSettings((p) => !p); }}
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 10px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                border: showSettings ? "1px solid var(--proof-blue)" : "1px solid var(--proof-grey)",
                background: showSettings ? "var(--proof-blue-bg)" : "var(--proof-surface)",
                color: showSettings ? "var(--proof-blue)" : "var(--proof-text-secondary)",
              }}
            >
              <Settings size={11} />
              Configure
            </button>
            {settingsSaved && (
              <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 600 }}>Saved!</span>
            )}
            {showProviderMenu && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 12,
                  zIndex: 100,
                  marginTop: 4,
                  background: "var(--proof-surface)",
                  border: "1px solid var(--proof-grey)",
                  borderRadius: 6,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  overflow: "hidden",
                  minWidth: 200,
                }}
              >
                {(["openai", "webllm", "chrome"] as LLMProviderType[]).map((type) => {
                  const avail = providerAvail[type];
                  const meta = PROVIDER_META[type];
                  const isCurrent = type === currentProvider;
                  return (
                    <button
                      key={type}
                      onClick={() => switchProvider(type)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "8px 12px",
                        cursor: "pointer",
                        border: "none",
                        background: isCurrent ? "var(--proof-blue-bg)" : "transparent",
                        color: "var(--proof-text)",
                        fontSize: 12,
                        textAlign: "left",
                        borderBottom: "1px solid var(--proof-grey)",
                      }}
                    >
                      <span style={{ color: meta.color }}>{meta.icon}</span>
                      <span style={{ flex: 1 }}>{meta.label}</span>
                      {avail === true && (
                        <span style={{ fontSize: 10, color: "#22c55e" }}>Available</span>
                      )}
                      {avail === false && (
                        <span style={{ fontSize: 10, color: "#ef4444" }}>Unavailable</span>
                      )}
                      {isCurrent && (
                        <span
                          style={{
                            fontSize: 9,
                            background: "var(--proof-blue)",
                            color: "white",
                            padding: "1px 5px",
                            borderRadius: 3,
                          }}
                        >
                          Active
                        </span>
                      )}
                    </button>
                  );
                })}
                <div
                  style={{
                    padding: "8px 12px",
                    fontSize: 10,
                    color: "var(--proof-text-secondary)",
                    borderTop: "1px solid var(--proof-grey)",
                    background: "var(--proof-grey-bg)",
                  }}
                >
                  {currentProvider === "openai" &&
                    !providerAvail.openai &&
                    "Click ⚙ Configure above to enter your API key"}
                  {currentProvider === "webllm" &&
                    !providerAvail.webllm &&
                    "Requires Chrome 113+ with WebGPU"}
                  {currentProvider === "chrome" &&
                    !providerAvail.chrome &&
                    "Requires Chrome 148+ with Gemini Nano enabled"}
                </div>
              </div>
            )}
          </div>
          {/* Settings panel */}
          {showSettings && (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 8,
                marginBottom: 8,
                background: "var(--proof-surface)",
                border: "1px solid var(--proof-blue)",
                boxShadow: "0 2px 8px rgba(91,138,245,0.1)",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Globe size={13} style={{ color: "var(--proof-blue)" }} />
                OpenAI / Compatible API Settings
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--proof-text-secondary)" }}>
                    API Key <span style={{ color: "#ef4444" }}>*</span>
                  </span>
                  <input
                    type="password"
                    value={settingsApiKey}
                    onChange={(e) => setSettingsApiKey(e.target.value)}
                    placeholder="sk-..."
                    style={{
                      padding: "6px 10px",
                      borderRadius: 5,
                      border: "1px solid var(--proof-grey)",
                      background: "var(--proof-grey-bg)",
                      color: "var(--proof-text)",
                      fontSize: 12,
                      fontFamily: "monospace",
                      outline: "none",
                    }}
                  />
                </label>
                <div style={{ display: "flex", gap: 10 }}>
                  <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--proof-text-secondary)" }}>
                      Model
                    </span>
                    <input
                      type="text"
                      value={settingsModel}
                      onChange={(e) => setSettingsModel(e.target.value)}
                      placeholder="gpt-4o-mini"
                      style={{
                        padding: "6px 10px",
                        borderRadius: 5,
                        border: "1px solid var(--proof-grey)",
                        background: "var(--proof-grey-bg)",
                        color: "var(--proof-text)",
                        fontSize: 12,
                        outline: "none",
                      }}
                    />
                  </label>
                  <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--proof-text-secondary)" }}>
                      API URL (optional)
                    </span>
                    <input
                      type="text"
                      value={settingsApiUrl}
                      onChange={(e) => setSettingsApiUrl(e.target.value)}
                      placeholder="https://api.openai.com/v1/chat/completions"
                      style={{
                        padding: "6px 10px",
                        borderRadius: 5,
                        border: "1px solid var(--proof-grey)",
                        background: "var(--proof-grey-bg)",
                        color: "var(--proof-text)",
                        fontSize: 12,
                        outline: "none",
                      }}
                    />
                  </label>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                  <button
                    onClick={handleSaveSettings}
                    disabled={!settingsApiKey.trim()}
                    style={{
                      padding: "6px 16px",
                      borderRadius: 5,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: settingsApiKey.trim() ? "pointer" : "not-allowed",
                      border: "none",
                      background: settingsApiKey.trim() ? "var(--proof-blue)" : "var(--proof-grey)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    Save & Connect
                  </button>
                  <button
                    onClick={() => setShowSettings(false)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 5,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      border: "1px solid var(--proof-grey)",
                      background: "transparent",
                      color: "var(--proof-text-secondary)",
                    }}
                  >
                    Cancel
                  </button>
                  <span style={{ fontSize: 10, color: "var(--proof-text-muted)", marginLeft: 4 }}>
                    Key is stored in your browser only — never sent anywhere except the LLM API.
                  </span>
                </div>
              </div>
            </div>
          )}
          {!aiReady && usingFallback && (
            <div
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 12,
                background: "var(--proof-yellow-bg)",
                color: "var(--proof-yellow)",
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <AlertCircle size={14} />
              Offline mode — analysis uses deterministic fallbacks. Select a different provider or
              configure an API key.
            </div>
          )}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              padding: "8px 0",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "88%",
                }}
              >
                {msg.role === "assistant" && (
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #3d6ff5 0%, #7c6af5 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 0 0 2px rgba(91,138,245,0.25)",
                    }}
                  >
                    <Bot size={14} style={{ color: "white" }} />
                  </div>
                )}
                <div
                  style={{
                    padding: "11px 15px",
                    borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "4px 14px 14px 14px",
                    fontSize: 13,
                    lineHeight: 1.65,
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, #5b8af5 0%, #7c6af5 100%)"
                      : "var(--proof-surface-2)",
                    color: msg.role === "user" ? "white" : "var(--proof-text)",
                    border: msg.role === "user" ? "none" : "1px solid var(--proof-border-strong)",
                    boxShadow: msg.role === "user"
                      ? "0 2px 12px rgba(91,138,245,0.3)"
                      : "var(--proof-shadow-sm)",
                    maxWidth: "100%",
                    overflow: "hidden",
                  }}
                >
                  {msg.role === "user" ? (
                    msg.content
                  ) : (
                    <>
                      <Markdown
                        content={
                          expandedMsgs.has(i) || msg.content.length <= MAX_PREVIEW
                            ? msg.content
                            : msg.content.slice(0, MAX_PREVIEW) + "\n\n*…response truncated*"
                        }
                        mono={msg.type === "analysis"}
                      />
                      {msg.content.length > MAX_PREVIEW && (
                        <button
                          onClick={() => toggleExpand(i)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            marginTop: 6,
                            padding: "4px 10px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            border: "1px solid var(--proof-grey)",
                            background: "transparent",
                            color: "var(--proof-blue)",
                          }}
                        >
                          {expandedMsgs.has(i) ? (
                            <>
                              <ChevronUp size={12} /> Show less
                            </>
                          ) : (
                            <>
                              <ChevronDown size={12} /> Show full response ({msg.content.length}{" "}
                              chars)
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
                {msg.role === "user" && (
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: "var(--proof-surface-3)",
                      border: "1px solid var(--proof-border-strong)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <User size={13} style={{ color: "var(--proof-text-secondary)" }} />
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  alignSelf: "flex-start",
                  maxWidth: "85%",
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #3d6ff5 0%, #7c6af5 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 0 0 2px rgba(91,138,245,0.25)",
                  }}
                >
                  <Bot size={14} style={{ color: "white" }} />
                </div>
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "4px 14px 14px 14px",
                    fontSize: 13,
                    background: "var(--proof-surface-2)",
                    border: "1px solid var(--proof-border-strong)",
                    boxShadow: "var(--proof-shadow-sm)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {[0, 0.18, 0.36].map((delay, idx) => (
                      <span
                        key={idx}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "var(--proof-blue)",
                          animation: "thinkingBounce 1.2s ease-in-out infinite",
                          animationDelay: `${delay}s`,
                          display: "inline-block",
                          boxShadow: "0 0 4px rgba(91,138,245,0.5)",
                        }}
                      />
                    ))}
                  </span>
                  <span
                    style={{
                      color: "var(--proof-text-secondary)",
                      fontSize: 12,
                    }}
                  >
                    {thinkingMsg}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "12px 0 2px",
              borderTop: "1px solid var(--proof-border)",
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about test runs, CDN health, or select an analysis type from the sidebar…"
              rows={2}
              style={{
                flex: 1,
                padding: "10px 14px",
                fontSize: 13,
                borderRadius: 10,
                border: "1px solid var(--proof-border-strong)",
                resize: "none",
                background: "var(--proof-surface-2)",
                color: "var(--proof-text)",
                fontFamily: "var(--font-sans)",
                outline: "none",
                lineHeight: 1.5,
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(91,138,245,0.5)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(91,138,245,0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--proof-border-strong)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              onClick={handleSend}
              disabled={busy || !input.trim()}
              style={{
                alignSelf: "flex-end",
                padding: "10px 18px",
                borderRadius: 10,
                background: busy || !input.trim()
                  ? "var(--proof-surface-3)"
                  : "linear-gradient(135deg, #5b8af5 0%, #7c6af5 100%)",
                color: busy || !input.trim() ? "var(--proof-text-muted)" : "white",
                border: "none",
                cursor: busy || !input.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                boxShadow: busy || !input.trim() ? "none" : "0 2px 10px rgba(91,138,245,0.35)",
                transition: "all 0.15s",
              }}
            >
              {busy ? (
                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <Send size={14} />
              )}
              {busy ? "Processing" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
