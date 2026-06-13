import React from "react";
import { AppLayout } from "@/components/aware/AppLayout";
import {
  Send,
  Bot,
  AlertCircle,
  Zap,
  Bug,
  TrendingUp,
  Shield,
  Layers,
  LineChart,
  Activity,
  Search,
  Wifi,
  WifiOff,
  Cpu,
  Globe,
  Settings,
  Loader2,
  RefreshCw,
  BookOpen,
  Terminal,
  EyeOff,
  GitBranch,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Timer,
} from "lucide-react";
import {
  AI_USE_CASES,
  runFallbackAnalysis,
  generateInsights,
  buildAIContext,
  buildSystemPrompt,
  runLangGraphAnalysis,
  runLangGraphChat,
} from "@/lib/ai";
import type { AIInsight, AIUseCase } from "@/lib/ai";
import { getProvider, getLLMConfig, setLLMConfig } from "@/lib/llm";
import { RUNS } from "@/lib/runs";
import type { LLMProviderType, LLMMessage } from "@/lib/types";
import { checkWebLLM, getChromeAIStatus } from "@/lib/llm";
import ChatMessage, { type ChatMsg } from "@/components/aware/ChatMessage";
import type { LangGraphExecutionState } from "@/lib/ai/langGraphTypes";
import { getLogs, subscribeLogs, clearLogs } from "@/lib/ai/debugLogger";
import { getSkillDefinition } from "@/lib/ai/skillRegistry";
import type { SkillDefinition } from "@/lib/ai/skillRegistry";

export const USE_CASE_ICONS: Record<string, React.ReactNode> = {
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
  "failure-clustering": <Layers size={14} />,
  "duration-budget": <Zap size={14} />,
  "coverage-gap": <Search size={14} />,
  "smart-alerting": <AlertCircle size={14} />,
  "run-frequency": <Activity size={14} />,
  "cross-category-correlation": <TrendingUp size={14} />,
  "promotion-decision-support": <Shield size={14} />,
  "trend-forecasting": <LineChart size={14} />,
  "failure-impact": <AlertCircle size={14} />,
  "env-drift": <Layers size={14} />,
  "quality-gate": <Shield size={14} />,
  "suite-health": <Activity size={14} />,
  "test-doc-gen": <Search size={14} />,
  "test-redundancy": <Bug size={14} />,
  "release-readiness": <Shield size={14} />,
  "env-health-summary": <Activity size={14} />,
  "regression-report": <TrendingUp size={14} />,
  "setup-guide": <BookOpen size={14} />,
};

// Follow-up suggestions: which quick actions to suggest after each analysis
const FOLLOW_UP_MAP: Record<string, string[]> = {
  "failure-analysis": ["root-cause-analysis", "failure-clustering", "failure-impact"],
  "flaky-detection": ["failure-analysis", "quality-gate"],
  "regression-prediction": ["build-risk-assessment", "category-health"],
  "performance-trends": ["duration-budget", "anomaly-detection"],
  "anomaly-detection": ["failure-analysis", "smart-alerting"],
  "root-cause-analysis": ["failure-analysis", "regression-report"],
  "risk-scoring": ["build-risk-assessment", "release-readiness"],
  "category-health": ["coverage-gap", "env-health-summary"],
  "env-comparison": ["env-drift", "env-health-summary"],
  "build-risk-assessment": ["release-readiness", "promotion-decision-support"],
  "failure-clustering": ["root-cause-analysis", "failure-impact"],
  "duration-budget": ["performance-trends", "anomaly-detection"],
  "coverage-gap": ["test-doc-gen", "category-health"],
  "smart-alerting": ["anomaly-detection", "failure-analysis"],
  "run-frequency": ["env-health-summary", "suite-health"],
  "cross-category-correlation": ["regression-prediction", "trend-forecasting"],
  "promotion-decision-support": ["release-readiness", "quality-gate"],
  "trend-forecasting": ["regression-prediction", "anomaly-detection"],
  "failure-impact": ["root-cause-analysis", "build-risk-assessment"],
  "env-drift": ["env-comparison", "env-health-summary"],
  "quality-gate": ["release-readiness", "build-risk-assessment"],
  "suite-health": ["category-health", "coverage-gap"],
  "test-doc-gen": ["coverage-gap", "category-health"],
  "test-redundancy": ["coverage-gap", "test-doc-gen"],
  "release-readiness": [
    "build-risk-assessment",
    "promotion-decision-support",
    "env-health-summary",
  ],
  "env-health-summary": ["env-comparison", "env-drift", "smart-alerting"],
  "regression-report": ["failure-analysis", "build-risk-assessment", "cross-category-correlation"],
  "setup-guide": ["env-health-summary", "release-readiness"],
};

function getFollowUpSuggestions(useCaseId: string): { id: string; name: string }[] {
  const ids = FOLLOW_UP_MAP[useCaseId] || [];
  return ids.map((id) => AI_USE_CASES.find((uc) => uc.id === id)).filter(Boolean) as {
    id: string;
    name: string;
  }[];
}

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

type ProviderStatus = "available" | "downloading" | "unavailable";

async function probeProvider(type: LLMProviderType): Promise<ProviderStatus> {
  try {
    if (type === "webllm") {
      const ok = await checkWebLLM();
      return ok ? "available" : "unavailable";
    }
    if (type === "chrome") return getChromeAIStatus();
    if (type === "openai") {
      const cfg = getLLMConfig();
      if (!cfg.apiKey) return "unavailable";
      const prov = getProvider();
      return (await prov.testConnection()) ? "available" : "unavailable";
    }
    return "unavailable";
  } catch {
    return "unavailable";
  }
}

export default function Copilot() {
  const [_activeUseCase, setActiveUseCase] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [aiReady, setAiReady] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [_insights, setInsights] = React.useState<AIInsight[]>([]);
  const [usingFallback, setUsingFallback] = React.useState(false);
  const [providerAvail, setProviderAvail] = React.useState<Record<string, ProviderStatus>>({});
  const [expandedMsgs, setExpandedMsgs] = React.useState<Set<number>>(new Set());
  const [showProviderMenu, setShowProviderMenu] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [settingsApiKey, setSettingsApiKey] = React.useState("");
  const [settingsApiUrl, setSettingsApiUrl] = React.useState("");
  const [settingsModel, setSettingsModel] = React.useState("");
  const [settingsSaved, setSettingsSaved] = React.useState(false);
  const [thinkingMsg, setThinkingMsg] = React.useState(PROCESSING_MESSAGES[0]);
  const [showDebugPanel, setShowDebugPanel] = React.useState(false);
  const [debugLogs, setDebugLogs] = React.useState<ReturnType<typeof getLogs>>([]);
  const [lgState, setLgState] = React.useState<LangGraphExecutionState | null>(null);
  const [lgHistory, setLgHistory] = React.useState<LangGraphExecutionState[]>([]);
  const providerRef = React.useRef<HTMLDivElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const debugEndRef = React.useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const cfg = getLLMConfig();
  const currentProvider = cfg.provider;

  const probeAllProviders = React.useCallback(async () => {
    const results: Record<string, ProviderStatus> = {};
    for (const type of ["openai", "webllm", "chrome"] as LLMProviderType[]) {
      results[type] = await probeProvider(type);
    }
    setProviderAvail(results);
    return results;
  }, []);

  const init = React.useCallback(async () => {
    try {
      const persisted = loadPersistedMessages();
      if (persisted.length > 0) {
        setMessages(persisted);
        setLoading(false);
        return;
      }
      const ctx = buildAIContext();
      const [insightsList, avail] = await Promise.all([generateInsights(), probeAllProviders()]);
      setInsights(insightsList);
      const currentOk = (avail[currentProvider] ?? "unavailable") === "available";
      setAiReady(currentOk);
      setUsingFallback(!currentOk);
      const lastRun = [...RUNS].sort(
        (a, b) => new Date(b.started).getTime() - new Date(a.started).getTime(),
      )[0];
      const intro = {
        role: "assistant",
        content: `Hello! I'm **A.W.A.R.E. Copilot** — analyzing **${ctx.stats.totalRuns} runs** across **${ctx.stats.totalSuites} suites** with **${ctx.stats.totalTests} tests** (avg ${ctx.stats.avgPassRate}% pass rate).\n\n**Provider:** ${PROVIDER_META[currentProvider].label} — ${currentOk ? "✅ Connected" : "❌ Unavailable"}${currentOk ? "" : "\n\n> Switch providers using the dropdown above, or configure an API key."}\n\n### Latest Run: \`${lastRun?.id}\`\n\n| Detail | Value |\n|--------|-------|\n| Label | ${lastRun?.label} |\n| Status | **${lastRun?.status}** |\n| Pass Rate | ${lastRun?.passPct}% |\n| Failures | ${lastRun?.failures} |\n| Duration | ${lastRun?.duration} |\n| Environment | ${lastRun?.env} / ${lastRun?.envId} |\n| Build | \`${lastRun?.build}\` |\n\nSelect an analysis type from the sidebar or ask a question.`,
        type: "intro",
        timestamp: Date.now(),
      };
      setMessages([intro]);
      persistMessages([intro]);
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

  // Persist messages to localStorage whenever they change
  React.useEffect(() => {
    if (!loading && messages.length > 0) {
      persistMessages(messages);
    }
  }, [messages, loading]);

  // Subscribe to debug logs
  React.useEffect(() => {
    const unsub = subscribeLogs(() => {
      setDebugLogs([...getLogs()]);
    });
    return unsub;
  }, []);

  // Auto-scroll debug panel
  React.useEffect(() => {
    if (showDebugPanel) {
      debugEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [debugLogs, showDebugPanel]);

  // LangGraph node state display
  const handleLgNodeChange = React.useCallback((state: LangGraphExecutionState) => {
    setLgState(state);
    setLgHistory((prev) => {
      const existing = prev.findIndex((s) => s.nodeId === state.nodeId);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = state;
        return next;
      }
      return [...prev, state];
    });
  }, []);

  // Cycle processing messages when busy
  React.useEffect(() => {
    if (!busy) {
      setThinkingMsg(PROCESSING_MESSAGES[0]);
      return;
    }
    setThinkingMsg("");
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % PROCESSING_MESSAGES.length;
      if (!lgState || lgState.status === "completed") {
        setThinkingMsg(PROCESSING_MESSAGES[i]);
      }
    }, 1800);
    return () => clearInterval(interval);
  }, [busy, lgState]);

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
    setMessages((prev) => [...prev, { role: "user", content: useCase.name, type: "use-case", timestamp: Date.now() }]);
    setBusy(true);
    setLgHistory([]);
    setLgState(null);
    clearLogs();
    try {
      // Quick actions use LangGraph engine with deterministic fallback
      const result = await runLangGraphAnalysis(
        { useCaseId: useCase.id, parameters: {} },
        handleLgNodeChange,
      );
      const resultText = result.details || result.summary;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: resultText,
          type: "analysis",
          followUps: getFollowUpSuggestions(useCase.id),
          timestamp: Date.now(),
        },
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err.message}`, type: "error", timestamp: Date.now() },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const CAPABILITY_RE =
    /\b(capabilities|what you can do|what can you do|what do you do|what are you|how can you help|what can i (ask|do)|help me|get started|show me what|what can i use you for|what do you know|what.{0,10}can.{0,10}do|your capabilities|your features|show (me )?(what|your))\b/i;

  // Intent → use case mapping for smart question routing
  const INTENT_MAP: [RegExp, string][] = [
    [
      /\b(release|deploy|rollout|go.?live|ready|ship)\b.*\b(safe|ready|check|status)\b/i,
      "release-readiness",
    ],
    [/\b(env|environment)\b.*\b(health|status|snapshot|check|how)\b/i, "env-health-summary"],
    [/\bhow are\b.*\b(env|environment|stage|prod|qa|uat)\b/i, "env-health-summary"],
    [
      /\b(regress|regression|what changed|diff|compare)\b.*\b(build|last|latest|run)\b/i,
      "regression-report",
    ],
    [/\bcompare\b.*\b(build|run|two|last)\b/i, "regression-report"],
    [/\b(flaky|flip|flakiness|inconsistent)\b/i, "flaky-detection"],
    [/\b(fail|error|broken|crash|what.*wrong)\b/i, "failure-analysis"],
    [/\b(risk|safe.*deploy|deploy.*safe|should.*deploy|can.*deploy)\b/i, "build-risk-assessment"],
    [/\b(promot|gate|promotion|uat.*prod|stage.*prod)\b/i, "promotion-decision-support"],
    [/\b(quality.gate|gate.check|pass.*gate)\b/i, "quality-gate"],
    [/\b(category|group)\b.*\b(health|score|status)\b/i, "category-health"],
    [/\b(coverage|gap|missing|underrepresent)\b/i, "coverage-gap"],
    [/\b(slow|duration|budget|timeout|perf)\b/i, "duration-budget"],
    [/\b(anomaly|outlier|unusual|spike|drop)\b/i, "anomaly-detection"],
    [/\b(cluster|group.*fail|pattern|common.*fail)\b/i, "failure-clustering"],
    [/\b(redundant|duplicate|overlap|consolidat)\b/i, "test-redundancy"],
    [/\b(trend|forecast|predict|projection)\b/i, "trend-forecasting"],
    [/\b(perf|performance)\b.*\b(trend|change|slow)\b/i, "performance-trends"],
    [/\b(root.cause|why.*fail|reason.*fail)\b/i, "root-cause-analysis"],
    [/\b(alert|notif|watch|monitor)\b/i, "smart-alerting"],
    [/\b(doc|document|inventory|list.*test)\b/i, "test-doc-gen"],
    [/\b(suite)\b.*\b(health|status|score)\b/i, "suite-health"],
    [/\b(drift|config.*diff|env.*diff)\b/i, "env-drift"],
    [/\b(impact|blast.radius|affect|blast)\b.*\b(fail|error)\b/i, "failure-impact"],
    [/\b(correlat|relation|move.*together)\b/i, "cross-category-correlation"],
    [/\b(frequency|run.*often|schedule|gap)\b/i, "run-frequency"],
    [
      /\b(setup|set.?up|fork|configure|config|install|deploy|secret|github.pages|data.branch|validate.config|akamai.?config|environments.yml|test.suites|getting.started|how.do.i|not.working|broken.*ci|ci.*broken|yml.*error|yaml.*error|contractid|groupid|baseur|edgeworker)\b/i,
      "setup-guide",
    ],
  ];

  const handleSend = async () => {
    if (!input.trim() || busy) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg, type: "text", timestamp: Date.now() }]);

    // Intercept capability questions — show quick-action bubbles instantly
    if (CAPABILITY_RE.test(userMsg)) {
      setMessages((prev) => [...prev, { role: "assistant", content: "", type: "capabilities", timestamp: Date.now() }]);
      return;
    }

    // Intent-based routing: map question to a quick action use case via LangGraph
    const matchedIntent = INTENT_MAP.find(([re]) => re.test(userMsg));
    if (matchedIntent) {
      const [, useCaseId] = matchedIntent;
      const useCase = AI_USE_CASES.find((uc) => uc.id === useCaseId);
      if (useCase) {
        setBusy(true);
        setLgHistory([]);
        setLgState(null);
        clearLogs();
        try {
          const result = await runLangGraphAnalysis(
            { useCaseId, parameters: {} },
            handleLgNodeChange,
          );
          const resultText = result.details || result.summary;
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: resultText,
              type: "analysis",
              followUps: getFollowUpSuggestions(useCaseId),
              timestamp: Date.now(),
            },
          ]);
        } catch {
          // fall through to LLM below
        } finally {
          setBusy(false);
        }
        return;
      }
    }

    // Route free-text chat through LangGraph pipeline (logs + charts + compaction)
    setBusy(true);
    setLgHistory([]);
    setLgState(null);
    clearLogs();
    try {
      // Build history messages for the LLM
      const priorMessages = messages;
      const historyMessages: LLMMessage[] = priorMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .filter((m) => m.type !== "intro" && m.type !== "capabilities" && m.content.trim() !== "")
        .slice(-12) // keep last 6 turns (12 messages)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
      historyMessages.push({ role: "user", content: userMsg });

      const { response, charts } = await runLangGraphChat(historyMessages, handleLgNodeChange);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response, type: "chat", charts, timestamp: Date.now() },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err.message}`, type: "error", timestamp: Date.now() },
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

  const CHAT_STORAGE_KEY = "aware_copilot_v2";

  const persistMessages = (msgs: typeof messages) => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(msgs));
    } catch {
      /* ignore */
    }
  };

  const loadPersistedMessages = (): typeof messages => {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const clearPersistedMessages = () => {
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const copyMessage = async (i: number, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(i);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const newChat = () => {
    setMessages([]);
    setActiveUseCase(null);
    setInput("");
    clearPersistedMessages();
    setTimeout(() => textareaRef.current?.focus(), 0);
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
      <div
        className="proof-page"
        style={{ display: "flex", height: "calc(100vh - 96px)", gap: 16 }}
      >
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
              {providerAvail[currentProvider] === "available" ? (
                <Wifi size={11} style={{ color: "#22c55e" }} />
              ) : providerAvail[currentProvider] === "downloading" ? (
                <Loader2
                  size={11}
                  style={{ color: "#f59e0b", animation: "spin 1s linear infinite" }}
                />
              ) : (
                <WifiOff size={11} style={{ color: "#ef4444" }} />
              )}
            </button>
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color:
                  providerAvail[currentProvider] === "available"
                    ? "#22c55e"
                    : providerAvail[currentProvider] === "downloading"
                      ? "#f59e0b"
                      : "#ef4444",
              }}
            >
              {providerAvail[currentProvider] === "available"
                ? "Connected"
                : providerAvail[currentProvider] === "downloading"
                  ? "Downloading…"
                  : "Unavailable"}
            </span>
            <button
              onClick={newChat}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 8px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid var(--proof-grey)",
                background: "var(--proof-surface)",
                color: "var(--proof-text-secondary)",
              }}
              title="Clear conversation"
            >
              <RefreshCw size={11} />
              New Chat
            </button>
            <button
              onClick={() => setShowDebugPanel((p) => !p)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 8px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                border: showDebugPanel
                  ? "1px solid var(--proof-green)"
                  : "1px solid var(--proof-grey)",
                background: showDebugPanel ? "#22c55e20" : "var(--proof-surface)",
                color: showDebugPanel ? "#22c55e" : "var(--proof-text-secondary)",
              }}
              title="Toggle debug log panel"
            >
              {showDebugPanel ? <EyeOff size={11} /> : <Terminal size={11} />}
              Debug
            </button>
            <button
              onClick={() => {
                setShowProviderMenu(false);
                setShowSettings((p) => !p);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 10px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                border: showSettings
                  ? "1px solid var(--proof-blue)"
                  : "1px solid var(--proof-grey)",
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
                  const status = providerAvail[type];
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
                      {status === "available" && (
                        <span
                          style={{
                            fontSize: 10,
                            color: "#22c55e",
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <Wifi size={10} /> Ready
                        </span>
                      )}
                      {status === "downloading" && (
                        <span
                          style={{
                            fontSize: 10,
                            color: "#f59e0b",
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />{" "}
                          Downloading
                        </span>
                      )}
                      {status === "unavailable" && (
                        <span
                          style={{
                            fontSize: 10,
                            color: "#ef4444",
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <WifiOff size={10} /> Unavailable
                        </span>
                      )}
                      {!status && (
                        <span style={{ fontSize: 10, color: "var(--proof-text-muted)" }}>—</span>
                      )}
                      {isCurrent && (
                        <span
                          style={{
                            fontSize: 9,
                            background: "var(--proof-blue)",
                            color: "white",
                            padding: "1px 5px",
                            borderRadius: 3,
                            marginLeft: 4,
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
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--proof-text)",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Globe size={13} style={{ color: "var(--proof-blue)" }} />
                OpenAI / Compatible API Settings
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--proof-text-secondary)",
                    }}
                  >
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
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--proof-text-secondary)",
                      }}
                    >
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
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--proof-text-secondary)",
                      }}
                    >
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
            {(() => {
              const msgMeta = messages.map((msg, i) => {
                const prev = messages[i - 1];
                const next = messages[i + 1];
                const sameRoleAsPrev = prev && prev.role === msg.role;
                const sameRoleAsNext = next && next.role === msg.role;
                return {
                  isFirstInGroup: !sameRoleAsPrev,
                  isLastInGroup: !sameRoleAsNext,
                  showAvatar: msg.role === "assistant" ? !sameRoleAsPrev : !sameRoleAsNext,
                };
              });
              return messages.map((msg, i) => (
                <ChatMessage
                  key={i}
                  msg={msg}
                  index={i}
                  {...msgMeta[i]}
                  expanded={expandedMsgs.has(i)}
                  copied={copiedIndex === i}
                  useCases={AI_USE_CASES}
                  useCaseIcons={USE_CASE_ICONS}
                  onToggleExpand={() => toggleExpand(i)}
                  onCopy={() => copyMessage(i, msg.content)}
                  onNewChat={newChat}
                  onFollowUp={handleUseCase}
                  MAX_PREVIEW={MAX_PREVIEW}
                />
              ));
            })()}
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
                    flexDirection: "column",
                    gap: 8,
                    minWidth: 200,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
                    {lgState ? (
                      <span
                        style={{
                          color: "var(--proof-text-secondary)",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {lgState.label}
                      </span>
                    ) : (
                      <span
                        style={{
                          color: "var(--proof-text-secondary)",
                          fontSize: 12,
                        }}
                      >
                        {thinkingMsg}
                      </span>
                    )}
                  </div>
                  {lgState && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--proof-text-muted)",
                          lineHeight: 1.4,
                        }}
                      >
                        {lgState.description}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 4,
                          alignItems: "center",
                          marginTop: 4,
                        }}
                      >
                        <GitBranch size={9} style={{ color: "var(--proof-text-muted)" }} />
                        <span
                          style={{
                            fontSize: 9,
                            color: "var(--proof-text-muted)",
                            fontFamily: "monospace",
                            lineHeight: 1.6,
                          }}
                        >
                          {(() => {
                            // Group history by iteration (same-timestamp-started nodes = parallel)
                            const groups: typeof lgHistory = [];
                            const seen = new Set<string>();
                            for (const s of lgHistory) {
                              if (!seen.has(s.nodeId)) {
                                seen.add(s.nodeId);
                                groups.push(s);
                              }
                            }
                            return groups.map((s, i) => (
                              <span
                                key={s.nodeId}
                                style={{ display: "inline-flex", alignItems: "center", gap: 1 }}
                              >
                                {i > 0 && (
                                  <ArrowRight
                                    size={8}
                                    style={{
                                      display: "inline",
                                      margin: "0 2px",
                                      verticalAlign: "middle",
                                      opacity: 0.6,
                                    }}
                                  />
                                )}
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 2,
                                    padding: "1px 4px",
                                    borderRadius: 3,
                                    background:
                                      s.status === "completed"
                                        ? "#22c55e18"
                                        : s.status === "running"
                                          ? "#5b8af518"
                                          : s.status === "error"
                                            ? "#ef444418"
                                            : "transparent",
                                  }}
                                >
                                  <span
                                    style={{
                                      width: 5,
                                      height: 5,
                                      borderRadius: "50%",
                                      display: "inline-block",
                                      background:
                                        s.status === "completed"
                                          ? "#22c55e"
                                          : s.status === "error"
                                            ? "#ef4444"
                                            : s.status === "running"
                                              ? "#5b8af5"
                                              : "var(--proof-text-muted)",
                                    }}
                                  />
                                  <span
                                    style={{
                                      color:
                                        s.status === "completed"
                                          ? "#22c55e"
                                          : s.status === "error"
                                            ? "#ef4444"
                                            : s.status === "running"
                                              ? "#5b8af5"
                                              : "var(--proof-text-muted)",
                                      fontWeight: s.status === "running" ? 700 : 400,
                                    }}
                                  >
                                    {s.nodeId.replace(/_/g, " ")}
                                  </span>
                                  {s.duration !== undefined && (
                                    <span style={{ color: "#a855f770", fontSize: 8 }}>
                                      {s.duration}ms
                                    </span>
                                  )}
                                </span>
                              </span>
                            ));
                          })()}
                        </span>
                      </div>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {lgHistory.map((s) => (
                      <span
                        key={s.nodeId}
                        style={{
                          fontSize: 8,
                          padding: "1px 5px",
                          borderRadius: 3,
                          background:
                            s.status === "completed"
                              ? "#22c55e20"
                              : s.status === "running"
                                ? "#5b8af520"
                                : s.status === "error"
                                  ? "#ef444420"
                                  : "var(--proof-grey-bg)",
                          color:
                            s.status === "completed"
                              ? "#22c55e"
                              : s.status === "running"
                                ? "#5b8af5"
                                : s.status === "error"
                                  ? "#ef4444"
                                  : "var(--proof-text-muted)",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        {s.status === "completed" ? (
                          <CheckCircle2 size={7} />
                        ) : s.status === "error" ? (
                          <XCircle size={7} />
                        ) : s.status === "running" ? (
                          <Loader2 size={7} style={{ animation: "spin 1s linear infinite" }} />
                        ) : (
                          <Timer size={7} />
                        )}
                        {s.nodeId}
                      </span>
                    ))}
                  </div>
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
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 250) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask about test runs, CDN health…  (Enter to send, Ctrl+Enter for new line)"
              rows={1}
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
                minHeight: 40,
                maxHeight: 250,
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
                background:
                  busy || !input.trim()
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
        {/* Debug log panel */}
        {showDebugPanel && (
          <div
            style={{
              width: 280,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              borderLeft: "1px solid var(--proof-border)",
              paddingLeft: 12,
              overflowY: "auto",
              maxHeight: "calc(100vh - 120px)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
                paddingBottom: 6,
                borderBottom: "1px solid var(--proof-border)",
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#22c55e",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Terminal size={12} />
                Debug Log
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <span
                  style={{
                    fontSize: 9,
                    color: "var(--proof-text-muted)",
                    fontFamily: "monospace",
                  }}
                >
                  {debugLogs.length} events
                </span>
                <button
                  onClick={clearLogs}
                  style={{
                    fontSize: 9,
                    padding: "1px 5px",
                    borderRadius: 3,
                    cursor: "pointer",
                    border: "1px solid var(--proof-grey)",
                    background: "transparent",
                    color: "var(--proof-text-muted)",
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                lineHeight: 1.5,
                overflowY: "auto",
                flex: 1,
              }}
            >
              {debugLogs.length === 0 && (
                <div
                  style={{
                    color: "var(--proof-text-muted)",
                    fontSize: 10,
                    padding: "12px 0",
                    textAlign: "center",
                  }}
                >
                  No debug events yet. Run an analysis to see the LangGraph execution trace.
                </div>
              )}
              {debugLogs.map((entry, idx) => {
                const isCompaction =
                  entry.event?.toLowerCase().includes("compaction") ||
                  entry.node === "context_token_audit";
                const levelColors: Record<string, string> = {
                  info: "#5b8af5",
                  warn: "#f59e0b",
                  error: "#ef4444",
                  debug: "var(--proof-text-muted)",
                  timing: "#a855f7",
                };
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      gap: 6,
                      padding: "2px 4px",
                      borderRadius: 3,
                      background:
                        entry.level === "error"
                          ? "#ef444410"
                          : entry.level === "warn"
                            ? "#f59e0b10"
                            : isCompaction
                              ? "#a855f710"
                              : "transparent",
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        color: levelColors[entry.level] || "var(--proof-text-muted)",
                        fontWeight: entry.level === "error" ? 700 : 400,
                        flexShrink: 0,
                        width: 40,
                        fontSize: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {entry.level}
                    </span>
                    <span
                      style={{
                        color: "var(--proof-text-muted)",
                        flexShrink: 0,
                        fontSize: 8,
                        width: 14,
                        textAlign: "right",
                      }}
                    >
                      {entry.timestamp.slice(11, 19)}
                    </span>
                    {isCompaction && (
                      <span style={{ color: "#a855f7", fontSize: 8, flexShrink: 0 }}>🔄</span>
                    )}
                    <span
                      style={{
                        color: levelColors[entry.level] || "var(--proof-text-secondary)",
                        fontWeight: 600,
                        flexShrink: 0,
                        fontSize: 9,
                      }}
                    >
                      {entry.node}
                    </span>
                    <span
                      style={{
                        color: isCompaction ? "#a855f7" : "var(--proof-text-secondary)",
                        flex: 1,
                        wordBreak: "break-word",
                      }}
                    >
                      {entry.event}
                    </span>
                    {entry.duration !== undefined && (
                      <span
                        style={{
                          color: "#a855f7",
                          flexShrink: 0,
                          fontSize: 8,
                          fontFamily: "monospace",
                        }}
                      >
                        {entry.duration}ms
                      </span>
                    )}
                  </div>
                );
              })}
              <div ref={debugEndRef} />
            </div>
          </div>
        )}
        {/* Analysis use-cases sidebar */}
        <div
          style={{
            width: 220,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--proof-text-secondary)",
              padding: "4px 2px 8px",
              flexShrink: 0,
            }}
          >
            Quick Analysis
          </div>
          {(["analysis", "alert", "recommendation", "report", "setup"] as const).map((cat) => {
            const catUcs = AI_USE_CASES.filter((uc) => uc.category === cat);
            if (!catUcs.length) return null;
            const catLabel: Record<string, string> = {
              analysis: "Analysis",
              alert: "Alerts",
              recommendation: "Recommendations",
              report: "Reports",
              setup: "Setup & Config",
            };
            const catColor: Record<string, string> = {
              analysis: "#5b8af5",
              alert: "#ef4444",
              recommendation: "#22c55e",
              report: "#a855f7",
              setup: "#f59e0b",
            };
            return (
              <div key={cat} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: catColor[cat],
                    marginBottom: 4,
                    paddingLeft: 2,
                  }}
                >
                  {catLabel[cat]}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {catUcs.map((uc) => (
                    <button
                      key={uc.id}
                      onClick={() => handleUseCase(uc)}
                      title={uc.description}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 10px",
                        borderRadius: 7,
                        fontSize: 11,
                        fontWeight: _activeUseCase === uc.id ? 700 : 500,
                        cursor: "pointer",
                        border: `1px solid ${
                          _activeUseCase === uc.id ? catColor[cat] : `${catColor[cat]}28`
                        }`,
                        background:
                          _activeUseCase === uc.id ? `${catColor[cat]}22` : `${catColor[cat]}0c`,
                        color: _activeUseCase === uc.id ? catColor[cat] : "var(--proof-text)",
                        textAlign: "left",
                        width: "100%",
                        transition: "all 0.12s",
                        lineHeight: 1.3,
                        boxShadow:
                          _activeUseCase === uc.id ? `0 0 0 1px ${catColor[cat]}40` : "none",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `${catColor[cat]}1e`;
                        e.currentTarget.style.borderColor = `${catColor[cat]}55`;
                        e.currentTarget.style.color = catColor[cat];
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          _activeUseCase === uc.id ? `${catColor[cat]}22` : `${catColor[cat]}0c`;
                        e.currentTarget.style.borderColor =
                          _activeUseCase === uc.id ? catColor[cat] : `${catColor[cat]}28`;
                        e.currentTarget.style.color =
                          _activeUseCase === uc.id ? catColor[cat] : "var(--proof-text)";
                      }}
                    >
                      <span style={{ flexShrink: 0, opacity: 0.8 }}>
                        {USE_CASE_ICONS[uc.id] || <Zap size={11} />}
                      </span>
                      {uc.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
