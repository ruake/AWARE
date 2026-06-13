import React from "react";
import { AppLayout } from "@/components/aware/AppLayout";
import {
  Bot,
  AlertCircle,
  AlertTriangle,
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
  RefreshCw,
  Bell,
  Calendar,
  Copy,
  Rocket,
  Heart,
  Target,
  FileText,
  GitCompare,
  GitFork,
  BookOpen,
  GitBranch,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  XCircle,
  Timer,
} from "lucide-react";
import { AI_USE_CASES, runLangGraphAnalysis, runLangGraphChat, buildAIContext } from "@/lib/ai";
import type { AIUseCase } from "@/lib/ai";
import { getProvider, getLLMConfig, setLLMConfig } from "@/lib/llm";
import { RUNS } from "@/lib/runs";
import type { LLMProviderType } from "@/lib/types";
import { checkWebLLM, getChromeAIStatus } from "@/lib/llm";
import type { LangGraphExecutionState } from "@/lib/ai/langGraphTypes";
import { getLogs, subscribeLogs, clearLogs } from "@/lib/ai/debugLogger";
import Sidebar from "@/components/copilot/Sidebar";
import MessageList from "@/components/copilot/MessageList";
import InputBar from "@/components/copilot/InputBar";
import DebugPanel from "@/components/copilot/DebugPanel";
import SettingsPanel from "@/components/copilot/SettingsPanel";
import ProviderSelector from "@/components/copilot/ProviderSelector";
import type { ChatMsg } from "@/components/aware/ChatMessage";

// ── Icon Map ──────────────────────────────────────────────────────────────
export const USE_CASE_ICONS: Record<string, React.ReactNode> = {
  "failure-analysis": <Bug size={14} />,
  "flaky-detection": <RefreshCw size={14} />,
  "regression-prediction": <TrendingUp size={14} />,
  "performance-trends": <Timer size={14} />,
  "anomaly-detection": <AlertTriangle size={14} />,
  "root-cause-analysis": <Search size={14} />,
  "risk-scoring": <Shield size={14} />,
  "category-health": <Heart size={14} />,
  "env-comparison": <Layers size={14} />,
  "build-risk-assessment": <AlertCircle size={14} />,
  "failure-clustering": <GitBranch size={14} />,
  "duration-budget": <Zap size={14} />,
  "coverage-gap": <Target size={14} />,
  "smart-alerting": <Bell size={14} />,
  "run-frequency": <Calendar size={14} />,
  "cross-category-correlation": <GitCompare size={14} />,
  "promotion-decision-support": <ArrowRight size={14} />,
  "trend-forecasting": <LineChart size={14} />,
  "failure-impact": <XCircle size={14} />,
  "env-drift": <GitFork size={14} />,
  "quality-gate": <CheckCircle2 size={14} />,
  "suite-health": <Activity size={14} />,
  "test-doc-gen": <FileText size={14} />,
  "test-redundancy": <Copy size={14} />,
  "release-readiness": <Rocket size={14} />,
  "env-health-summary": <Wifi size={14} />,
  "regression-report": <BarChart3 size={14} />,
  "setup-guide": <BookOpen size={14} />,
};

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
  return (FOLLOW_UP_MAP[useCaseId] || [])
    .map((id) => AI_USE_CASES.find((uc) => uc.id === id))
    .filter(Boolean) as { id: string; name: string }[];
}

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

type ProviderStatus = "available" | "downloading" | "unavailable";

export default function CopilotPage() {
  // ── State ──────────────────────────────────────────────────
  const [activeUseCase, setActiveUseCase] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [aiReady, setAiReady] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [providerAvail, setProviderAvail] = React.useState<Record<string, ProviderStatus>>({});
  const [expandedMsgs, setExpandedMsgs] = React.useState<Set<number>>(new Set());
  const [showProviderMenu, setShowProviderMenu] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [settingsApiKey, setSettingsApiKey] = React.useState("");
  const [settingsApiUrl, setSettingsApiUrl] = React.useState("");
  const [settingsModel, setSettingsModel] = React.useState("");
  const [settingsSaved, setSettingsSaved] = React.useState(false);
  const [showDebugPanel, setShowDebugPanel] = React.useState(false);
  const [debugLogs, setDebugLogs] = React.useState<ReturnType<typeof getLogs>>([]);
  const [lgState, setLgState] = React.useState<LangGraphExecutionState | null>(null);
  const [lgHistory, setLgHistory] = React.useState<LangGraphExecutionState[]>([]);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const providerRef = React.useRef<HTMLDivElement | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const debugEndRef = React.useRef<HTMLDivElement | null>(null);

  // Auto-scroll messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-scroll debug panel
  React.useEffect(() => {
    if (showDebugPanel) debugEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [debugLogs, showDebugPanel]);

  // Subscribe to debug logs
  React.useEffect(() => {
    const unsub = subscribeLogs(() => setDebugLogs([...getLogs()]));
    return unsub;
  }, []);

  // Save/load messages to localStorage
  React.useEffect(() => {
    if (messages.length > 0 && !busy) {
      try {
        localStorage.setItem("aware_copilot_messages_v2", JSON.stringify(messages));
      } catch {
        /* empty */
      }
    }
  }, [messages, busy]);

  // Click outside provider menu
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (providerRef.current && !providerRef.current.contains(e.target as Node))
        setShowProviderMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Init
  React.useEffect(() => {
    (async () => {
      const avail: Record<string, ProviderStatus> = {
        openai: "available",
        webllm: "unavailable",
        chrome: "unavailable",
      };
      try {
        if (await checkWebLLM()) avail.webllm = "available";
      } catch {
        /* empty */
      }
      try {
        const s = await getChromeAIStatus();
        avail.chrome = s;
      } catch {
        /* empty */
      }
      setProviderAvail(avail);
      const saved = localStorage.getItem("aware_copilot_messages_v2");
      if (saved) {
        try {
          setMessages(JSON.parse(saved));
        } catch {
          /* empty */
        }
      } else {
        const ctx = buildAIContext();
        setMessages([
          {
            role: "assistant",
            content: `Hi! I'm the AWARE Copilot. ${ctx.stats.totalRuns > 0 ? `I see ${ctx.stats.totalRuns} runs across ${Object.keys(ctx.stats.envs || {}).length || "all"} environments. ` : ""}Try a **Quick Analysis** from the sidebar, or just ask me something!`,
            type: "text",
            timestamp: Date.now(),
          },
        ]);
      }
      setAiReady(true);
      setLoading(false);
    })();
  }, []);

  // ── Handlers ────────────────────────────────────────────────
  const handleLgNodeChange = React.useCallback((state: LangGraphExecutionState) => {
    setLgState(state);
    setLgHistory((prev) => {
      const existing = prev.findIndex((s) => s.nodeId === state.nodeId);
      if (existing >= 0) {
        const n = [...prev];
        n[existing] = state;
        return n;
      }
      return [...prev, state];
    });
  }, []);

  const handleUseCase = async (useCase: AIUseCase) => {
    if (useCase.category !== "setup" && RUNS.length === 0) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: useCase.name, type: "use-case", timestamp: Date.now() },
        {
          role: "assistant",
          content:
            "No test runs loaded yet. Data is fetched at runtime from the `data` branch. Seed data or try **Setup & Configuration Help**.",
          type: "analysis",
          timestamp: Date.now(),
        },
      ]);
      return;
    }
    setActiveUseCase(useCase.id);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: useCase.name, type: "use-case", timestamp: Date.now() },
    ]);
    setBusy(true);
    setLgHistory([]);
    setLgState(null);
    clearLogs();
    try {
      const result = await runLangGraphAnalysis(
        { useCaseId: useCase.id, parameters: {} },
        handleLgNodeChange,
      );
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.details || result.summary,
          type: "analysis",
          followUps: getFollowUpSuggestions(useCase.id),
          timestamp: Date.now(),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${err.message}`,
          type: "error",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || busy) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMsg, type: "text", timestamp: Date.now() },
    ]);
    if (
      /\b(capabilities|what you can do|what can you do|what do you do|how can you help|what can i (ask|do)|help me|show me what|what do you know)\b/i.test(
        userMsg,
      )
    ) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", type: "capabilities", timestamp: Date.now() },
      ]);
      return;
    }
    const matched = INTENT_MAP.find(([re]) => re.test(userMsg));
    if (matched) {
      const useCase = AI_USE_CASES.find((uc) => uc.id === matched[1]);
      if (useCase) {
        await handleUseCase(useCase);
        return;
      }
    }
    setBusy(true);
    setLgHistory([]);
    setLgState(null);
    clearLogs();
    try {
      const historyMessages: import("@/lib/types").LLMMessage[] = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      historyMessages.push({ role: "user", content: userMsg });
      const result = await runLangGraphChat(historyMessages, handleLgNodeChange);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.response,
          timestamp: Date.now(),
          charts: result.charts,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${err.message}`,
          type: "error",
          timestamp: Date.now(),
        },
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
    setTimeout(() => {
      const ctx = buildAIContext();
      setMessages([
        {
          role: "assistant",
          content: `Settings saved. I'm the AWARE Copilot. ${RUNS.length > 0 ? `I see ${RUNS.length} runs.` : ""} Ask me anything!`,
          type: "text",
          timestamp: Date.now(),
        },
      ]);
      setLoading(false);
    }, 0);
  };

  const switchProvider = async (type: LLMProviderType) => {
    setShowProviderMenu(false);
    setLoading(true);
    setLLMConfig({ provider: type });
    setMessages([]);
    setActiveUseCase(null);
    setTimeout(() => {
      setMessages([
        {
          role: "assistant",
          content: `Switched to ${type}. Ask me anything!`,
          type: "text",
          timestamp: Date.now(),
        },
      ]);
      setLoading(false);
    }, 0);
  };

  const toggleExpand = (i: number) => {
    setExpandedMsgs((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  };

  const copyMessage = async (i: number, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(i);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      /* empty */
    }
  };

  const newChat = () => {
    setMessages([]);
    setActiveUseCase(null);
    setExpandedMsgs(new Set());
    try {
      localStorage.removeItem("aware_copilot_messages_v2");
    } catch {
      /* empty */
    }
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  // ── Render ───────────────────────────────────────────────────
  if (loading) {
    return (
      <AppLayout>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
            gap: 10,
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              border: "2px solid var(--proof-border)",
              borderTopColor: "var(--proof-blue)",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span style={{ fontSize: 13, color: "var(--proof-text-secondary)" }}>
            Loading Copilot…
          </span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ display: "flex", height: "calc(100vh - 64px)", gap: 8, padding: 4 }}>
        {/* Sidebar */}
        <Sidebar
          activeUseCase={activeUseCase}
          useCaseIcons={USE_CASE_ICONS}
          onSelect={handleUseCase}
        />

        {/* Main Chat Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Top Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              paddingBottom: 8,
              borderBottom: "1px solid var(--proof-border)",
              flexWrap: "wrap",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Bot size={16} style={{ color: "var(--proof-blue)" }} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>AWARE Copilot</span>
              {aiReady && (
                <span
                  style={{
                    fontSize: 9,
                    padding: "1px 5px",
                    borderRadius: 3,
                    background: "#22c55e20",
                    color: "#22c55e",
                    fontWeight: 600,
                  }}
                >
                  Ready
                </span>
              )}
            </span>
            <div style={{ flex: 1 }} />
            <ProviderSelector
              providerAvail={providerAvail}
              loading={loading}
              showProviderMenu={showProviderMenu}
              providerRef={providerRef}
              onSwitch={switchProvider}
              onToggleMenu={() => {
                setShowSettings((p) => !p);
                setShowProviderMenu(false);
              }}
            />
            <SettingsPanel
              show={showSettings}
              apiKey={settingsApiKey}
              apiUrl={settingsApiUrl}
              model={settingsModel}
              saved={settingsSaved}
              onApiKeyChange={setSettingsApiKey}
              onApiUrlChange={setSettingsApiUrl}
              onModelChange={setSettingsModel}
              onSave={handleSaveSettings}
              onClose={() => setShowSettings(false)}
            />
            <DebugPanel
              show={showDebugPanel}
              logs={debugLogs}
              logEndRef={debugEndRef}
              onToggle={() => setShowDebugPanel((p) => !p)}
              onClear={clearLogs}
            />
            <button
              onClick={newChat}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 8px",
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid var(--proof-border)",
                background: "var(--proof-surface)",
                color: "var(--proof-text-secondary)",
              }}
            >
              New Chat
            </button>
          </div>

          {/* Messages */}
          <MessageList
            messages={messages}
            busy={busy}
            lgState={lgState}
            lgHistory={lgHistory}
            expandedMsgs={expandedMsgs}
            copiedIndex={copiedIndex}
            messagesEndRef={messagesEndRef}
            useCaseIcons={USE_CASE_ICONS}
            useCases={AI_USE_CASES}
            online={true}
            onToggleExpand={toggleExpand}
            onCopy={copyMessage}
            onFollowUp={handleUseCase}
            onNewChat={newChat}
          />

          {/* Input */}
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
