import React from "react";
import { AppLayout } from "@/components/aware/AppLayout";
import {
  Bot, Send, Sparkles, FileCode, Search, GitCompare,
  FolderTree, Settings2, Trash2, Loader2,
  AlertTriangle, Lightbulb, Zap, Download,
  GitBranch, Maximize2, Minimize2, MessageSquare, X, FileText,
} from "lucide-react";
import { llmChat, getLLMConfig, setLLMConfig, clearChatHistory, syncChatHistory, getRegisteredSkills, checkWebLLM, setWebLLMProgressCallback, getChromeAIStatus, setChromeAIProgressCallback, extractTestConfigFromMessage, savePendingTestConfig } from "@/lib/llm";
import { SKILLS, PROJECT_CONTEXT } from "@/lib/skills";
import type { LLMConfig, LLMSkillDefinition, LLMChatMessage } from "@/lib/types";
import { useLocation } from "wouter";
import ReactMarkdown from "react-markdown";
import { saveChatMessages, loadChatMessages, clearChatMessages } from "@/lib/chatStorage";
import { ChatFormControls, parseFormBlocks } from "@/components/aware/ChatFormControls";
import type { FormField } from "@/components/aware/ChatFormControls";
import { linkifyText } from "@/lib/linkify";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { MessageList, TypingIndicator } from "@chatscope/chat-ui-kit-react";

function stripTestConfigBlock(content: string): string {
  const start = "---TEST_CONFIG_START---";
  const end = "---TEST_CONFIG_END---";
  const si = content.indexOf(start);
  const ei = content.indexOf(end);
  if (si === -1 || ei === -1 || ei <= si) return content;
  return (content.substring(0, si) + content.substring(ei + end.length)).trim();
}

const MARKDOWN_COMPONENTS: Record<string, React.ComponentType<any>> = {
  code: ({ className, children, ...props }: any) => {
    const isInline = !className;
    return isInline
      ? <code style={{ background: "var(--gcp-grey-bg)", padding: "1px 4px", borderRadius: 3, fontSize: 11 }} {...props}>{children}</code>
      : <pre style={{ background: "var(--gcp-grey-bg)", padding: 8, borderRadius: 6, overflowX: "auto", fontSize: 11, lineHeight: 1.4, margin: "4px 0" }}><code className={className} {...props}>{children}</code></pre>;
  },
  strong: ({ children }: any) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
  em: ({ children }: any) => <em style={{ fontStyle: "italic" }}>{children}</em>,
  ul: ({ children }: any) => <ul style={{ paddingLeft: 16, margin: "4px 0" }}>{children}</ul>,
  ol: ({ children }: any) => <ol style={{ paddingLeft: 16, margin: "4px 0" }}>{children}</ol>,
  li: ({ children }: any) => <li style={{ marginBottom: 2 }}>{children}</li>,
  h1: ({ children }: any) => <h1 style={{ fontSize: 14, fontWeight: 700, margin: "8px 0 4px" }}>{children}</h1>,
  h2: ({ children }: any) => <h2 style={{ fontSize: 13, fontWeight: 700, margin: "6px 0 3px" }}>{children}</h2>,
  h3: ({ children }: any) => <h3 style={{ fontSize: 12, fontWeight: 700, margin: "4px 0 2px" }}>{children}</h3>,
  p: ({ children }: any) => <p style={{ margin: "4px 0" }}>{children}</p>,
  a: ({ href, children }: any) => {
    const isInternal = href && (href.startsWith("/") || href.startsWith("#"));
    return (
      <a
        href={href}
        onClick={isInternal ? (e: React.MouseEvent) => { e.preventDefault(); window.location.href = href; } : undefined}
        target={isInternal ? undefined : "_blank"}
        rel={isInternal ? undefined : "noreferrer"}
        style={{ color: "var(--gcp-blue)", textDecoration: "underline", cursor: "pointer" }}
      >
        {children}
      </a>
    );
  },
  hr: () => <hr style={{ border: "none", borderTop: "1px solid var(--gcp-grey)", margin: "8px 0" }} />,
  table: ({ children }: any) => <div style={{ overflowX: "auto" }}><table style={{ borderCollapse: "collapse", width: "100%", fontSize: 11, margin: "4px 0" }}>{children}</table></div>,
  th: ({ children }: any) => <th style={{ border: "1px solid var(--gcp-grey)", padding: "4px 6px", background: "var(--gcp-grey-bg)", fontWeight: 600, textAlign: "left" }}>{children}</th>,
  td: ({ children }: any) => <td style={{ border: "1px solid var(--gcp-grey)", padding: "4px 6px" }}>{children}</td>,
};

const DRAFT_CARD_STYLE: React.CSSProperties = {
  border: "1px solid var(--gcp-blue)",
  borderRadius: 8,
  overflow: "hidden",
  marginTop: 8,
  fontSize: 12,
};

function DraftTestCard({ config, onConfirm }: { config: Record<string, unknown>; onConfirm: () => void }) {
  const name = (config.name as string) || "Unnamed";
  const priority = (config.priority as string) || "";
  const severity = (config.severity as string) || "";
  const category = (config.category as string) || "";
  const status = (config.expectedStatus as string | number) ?? "";
  const predicates = (config.predicates as Array<Record<string, unknown>>) || [];
  return (
    <div style={DRAFT_CARD_STYLE}>
      <div style={{ padding: "8px 12px", background: "var(--gcp-blue-bg)", borderBottom: "1px solid var(--gcp-blue)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, fontSize: 11, color: "var(--gcp-blue)", textTransform: "uppercase", letterSpacing: "0.3px" }}>
          <FileText size={12} style={{ marginRight: 4, display: "inline", verticalAlign: "middle" }} />
          Draft Test Case
        </span>
      </div>
      <div style={{ padding: "10px 12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
        <div>
          <div style={{ fontSize: 10, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 1 }}>Name</div>
          <div style={{ fontWeight: 600 }}>{name}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 1 }}>Category</div>
          <div>{category}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 1 }}>Priority</div>
          <div>{priority}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 1 }}>Severity</div>
          <div>{severity}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 1 }}>Expected Status</div>
          <div>{status}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 1 }}>Predicates</div>
          <div>{predicates.length} rule{predicates.length !== 1 ? "s" : ""}</div>
        </div>
      </div>
      <div style={{ padding: "8px 12px", borderTop: "1px solid var(--gcp-blue)", display: "flex", gap: 6 }}>
        <button onClick={onConfirm} className="gcp-button gcp-button-primary" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
          <FileText size={12} /> Confirm & Open in Test Manager
        </button>
      </div>
    </div>
  );
}

type SkillOption = "none" | LLMSkillDefinition["id"];

const SKILL_ICONS: Record<string, React.ComponentType<any>> = {
  Sparkles, FileCode, Search, GitCompare, FolderTree,
};

export default function Copilot() {
  const [, navigate] = useLocation();
  const [messages, setMessages] = React.useState<LLMChatMessage[]>(() => {
    const loaded = loadChatMessages();
    syncChatHistory(loaded.map(m => ({ role: m.role as "system" | "user" | "assistant", content: m.content })));
    return loaded;
  });
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [activeSkill, setActiveSkill] = React.useState<SkillOption>("none");
  const [showConfig, setShowConfig] = React.useState(false);
  const [config, setConfig] = React.useState<LLMConfig>(getLLMConfig());
  const [webLlmOk, setWebLlmOk] = React.useState<boolean | null>(null);
  const [webLlmLoading, setWebLlmLoading] = React.useState(false);
  const [webLlmProgress, setWebLlmProgress] = React.useState(0);
  const [webLlmStatusText, setWebLlmStatusText] = React.useState("");
  const [chromeAIStatus, setChromeAIStatus] = React.useState<"available" | "downloadable" | "downloading" | "unavailable" | "checking">("checking");
  const [activeThread, setActiveThread] = React.useState<string | null>(null);
  const [fullWindow, setFullWindow] = React.useState(false);
  const [submittedForms, setSubmittedForms] = React.useState<Set<string>>(new Set());
  const [threadInput, setThreadInput] = React.useState("");

  const updateMessages = (fn: (prev: LLMChatMessage[]) => LLMChatMessage[]) => {
    setMessages(prev => {
      const next = fn(prev);
      saveChatMessages(next);
      return next;
    });
  };

  React.useEffect(() => {
    getChromeAIStatus().then(s => {
      setChromeAIStatus(s);
      if (s === "unavailable" && config.provider === "chrome") {
        const newCfg = { ...config, provider: "mock" as const };
        setConfig(newCfg);
        setLLMConfig(newCfg);
      }
    });
  }, []);

  React.useEffect(() => {
    checkWebLLM().then(ok => {
      setWebLlmOk(ok);
      if (ok && config.provider === "webllm") {
        setWebLlmLoading(true);
        setWebLLMProgressCallback((pct, txt) => {
          setWebLlmProgress(pct);
          setWebLlmStatusText(txt);
          if (pct >= 1) setTimeout(() => setWebLlmLoading(false), 500);
        });
      }
    });
    return () => { setWebLLMProgressCallback(null); };
  }, [config.provider]);

  const skills = getRegisteredSkills();
  const activeSkillDef = skills.find(s => s.id === activeSkill);
  const msgEndRef = React.useRef<HTMLDivElement>(null);
  const threadEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  React.useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread, messages]);

  const replyInThread = async (text: string, parentId: string) => {
    const replyMsg: LLMChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
      parentId,
      threadId: parentId,
    };
    updateMessages(prev => [...prev, replyMsg]);
    setLoading(true);
    try {
      const res = await llmChat(text, activeSkillDef?.systemPrompt ?? PROJECT_CONTEXT);
      const assistantReply: LLMChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        role: "assistant",
        content: res.content,
        timestamp: Date.now(),
        parentId,
        threadId: parentId,
      };
      updateMessages(prev => [...prev, assistantReply]);
    } catch (err) {
      updateMessages(prev => [...prev, {
        id: `msg_${Date.now()}_err`,
        role: "assistant",
        content: `Error: ${err instanceof Error ? err.message : "Request failed"}`,
        timestamp: Date.now(),
        parentId,
        threadId: parentId,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (text?: string) => {
    const msg = text ?? input;
    if (!msg.trim() || loading) return;
    setInput("");
    if (activeThread) {
      return replyInThread(msg.trim(), activeThread);
    }
    const userMsg: LLMChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      role: "user",
      content: msg.trim(),
      timestamp: Date.now(),
      skill: activeSkill,
    };
    updateMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await llmChat(msg.trim(), activeSkillDef?.systemPrompt ?? PROJECT_CONTEXT);
      const assistantMsg: LLMChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        role: "assistant",
        content: res.content,
        timestamp: Date.now(),
        skill: activeSkill,
      };
      updateMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      updateMessages(prev => [...prev, {
        id: `msg_${Date.now()}_err`,
        role: "assistant",
        content: `Error: ${err instanceof Error ? err.message : "Request failed"}`,
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleThreadReply = async () => {
    const text = threadInput.trim();
    if (!text || loading) return;
    setThreadInput("");
    return replyInThread(text, activeThread!);
  };

  const handleThreadKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleThreadReply(); }
  };

  const handleClear = () => {
    clearChatHistory();
    clearChatMessages();
    setMessages([]);
  };

  const handleConfigSave = () => {
    setLLMConfig(config);
    setShowConfig(false);
  };

  const handleForkThread = (parentMsg: LLMChatMessage) => {
    const parentSkill = parentMsg.skill ?? activeSkill;
    if (parentSkill && parentSkill !== "none") setActiveSkill(parentSkill);
    const contextMsg: LLMChatMessage = {
      id: `msg_${Date.now()}_fork`,
      role: "user",
      content: `[Forked from previous message] Continuing from: ${parentMsg.content.substring(0, 300)}`,
      timestamp: Date.now(),
      skill: parentSkill,
      parentId: undefined,
    };
    updateMessages(prev => [...prev, contextMsg]);
    setInput("");
  };

  const handleFormSubmit = async (msgId: string, values: Record<string, unknown>) => {
    if (loading) return;
    setSubmittedForms(prev => new Set(prev).add(msgId));
    const answer = Object.entries(values)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    updateMessages(prev => [...prev, {
      id: `msg_${Date.now()}_form`,
      role: "user",
      content: answer,
      timestamp: Date.now(),
      skill: activeSkill,
    }]);
    setLoading(true);
    try {
      const res = await llmChat(answer, activeSkillDef?.systemPrompt ?? PROJECT_CONTEXT);
      const assistantMsg: LLMChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        role: "assistant",
        content: res.content,
        timestamp: Date.now(),
        skill: activeSkill,
      };
      updateMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      updateMessages(prev => [...prev, {
        id: `msg_${Date.now()}_err`,
        role: "assistant",
        content: `Error: ${err instanceof Error ? err.message : "Request failed"}`,
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestCase = (content: string) => {
    const config = extractTestConfigFromMessage(content);
    if (!config) {
      updateMessages(prev => [...prev, {
        id: `msg_${Date.now()}_err`,
        role: "assistant",
        content: "No structured test configuration found in the last message. Make sure the LLM outputs a complete test config wrapped in `---TEST_CONFIG_START---` and `---TEST_CONFIG_END---` markers.",
        timestamp: Date.now(),
      }]);
      return;
    }
    savePendingTestConfig(config);
    navigate(`/tests`);
  };

  const startExample = (skillId: SkillOption) => {
    setActiveSkill(skillId);
    setInput("");
    const examples: Record<string, string> = {
      "generate-tests": "I need to create a test for CDN cache validation. Let me tell you what I need...",
      "generate-script": "Write a Playwright test script that validates cache HIT/MISS headers across multiple edge locations",
      "analyze-results": "Analyze these test failures: 12 cache tests failed with MISS instead of HIT, 3 geo-routing tests timed out for APAC region",
      "explain-diff": "Explain the diff between baseline and candidate where we see 7 new regressions in caching and 4 fixed tests in security",
      "generate-suite": "Generate a suite config for CDN migration testing with Slack notifications, 4 parallel workers, and 2 retries",
    };
    if (skillId !== "none") setInput(examples[skillId] ?? "");
  };

  const getThreadReplies = (parentId: string) =>
    messages.filter(m => m.parentId === parentId).sort((a, b) => a.timestamp - b.timestamp);

  const topLevelMessages = React.useMemo(
    () => messages.filter(m => !m.parentId),
    [messages]
  );

  const configPanel = showConfig && (
    <div className="gcp-card" style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10, flexShrink: 0, border: "1px solid var(--gcp-blue)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>Provider</label>
          <select className="gcp-input" style={{ width: "100%", fontSize: 11 }} value={config.provider} onChange={e => setConfig(p => ({ ...p, provider: e.target.value as LLMConfig["provider"] }))}>
            <option value="mock">Mock (offline) — no API key needed</option>
            <option value="openai">OpenAI / Compatible API</option>
            <option value="chrome" disabled={chromeAIStatus === "unavailable"}>Chrome Built-in AI (Gemini Nano) {chromeAIStatus === "unavailable" ? "⚠ not available" : chromeAIStatus === "checking" ? "⏳ checking..." : chromeAIStatus === "downloading" ? "⏳ downloading..." : chromeAIStatus === "downloadable" ? "📥 ready to download" : "✅ available"}</option>
            <option value="webllm" disabled={webLlmOk !== true}>WebLLM (browser GPU) {webLlmOk === false ? "⚠ not available" : webLlmOk === null ? "⏳ checking..." : ""}</option>
          </select>
          {config.provider === "mock" && <div style={{ fontSize: 10, color: "var(--gcp-text-secondary)", marginTop: 4, lineHeight: 1.4 }}>Mock generates canned responses. Works offline — no dependencies needed.</div>}
          {config.provider === "chrome" && <div style={{ fontSize: 10, color: "var(--gcp-text-secondary)", marginTop: 4, lineHeight: 1.4 }}>Uses Chrome's built-in Gemini Nano — fully local, free, no API key. Requires Chrome 148+ on desktop.</div>}
          {config.provider === "webllm" && <div style={{ fontSize: 10, color: "var(--gcp-text-secondary)", marginTop: 4, lineHeight: 1.4 }}>Runs Llama 3.2 locally in your browser via WebGPU. First use downloads ~650MB model. Use Chrome 113+.</div>}
        </div>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>Model</label>
          <input className="gcp-input" style={{ width: "100%", fontSize: 11 }} value={config.model} onChange={e => setConfig(p => ({ ...p, model: e.target.value }))} />
        </div>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>API URL</label>
          <input className="gcp-input" style={{ width: "100%", fontSize: 11 }} value={config.apiUrl ?? ""} onChange={e => setConfig(p => ({ ...p, apiUrl: e.target.value }))} placeholder={config.provider === "openai" ? "https://api.openai.com/v1" : ""} />
        </div>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>API Key</label>
          <input type="password" className="gcp-input" style={{ width: "100%", fontSize: 11 }} value={config.apiKey ?? ""} onChange={e => setConfig(p => ({ ...p, apiKey: e.target.value }))} />
        </div>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>Temperature</label>
          <input type="number" min={0} max={2} step={0.1} className="gcp-input" style={{ width: "100%", fontSize: 11 }} value={config.temperature} onChange={e => setConfig(p => ({ ...p, temperature: Number(e.target.value) }))} />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
          <button onClick={handleConfigSave} className="gcp-button gcp-button-primary" style={{ fontSize: 11 }}>Apply</button>
          <button onClick={() => { setConfig(getLLMConfig()); setShowConfig(false); }} className="gcp-button" style={{ fontSize: 11 }}>Cancel</button>
        </div>
      </div>
    </div>
  );

  const chatscopeTheme = `<style>
      .cs-message-list { background: transparent !important; }
      .cs-message-list__scroll-wrapper { padding: 4px 0 !important; }
      .cs-typing-indicator { background: transparent !important; padding: 4px 0 !important; }
      .cs-typing-indicator__text { color: var(--gcp-text-secondary) !important; font-size: 12px !important; }
      .cs-typing-indicator__dot { background: var(--gcp-text-secondary) !important; }
    </style>`;

  const mainContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: fullWindow ? "100vh" : "calc(100vh - 56px - 40px)", minHeight: 0 }}>

      {/* Header */}
      <div className="gcp-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Bot size={20} style={{ color: "var(--gcp-blue)" }} />
          <span style={{ fontWeight: 700, fontSize: 14 }}>AI Copilot</span>
          <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)", padding: "2px 6px", background: "var(--gcp-grey-bg)", borderRadius: 4 }}>
            {config.provider === "mock" ? "Mock (offline)" : config.provider === "chrome" ? "Chrome AI" : config.model}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button onClick={() => setShowConfig(p => !p)} className="gcp-button" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
            <Settings2 size={12} /> Config
          </button>
          <button onClick={() => setFullWindow(p => !p)} className="gcp-button" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
            {fullWindow ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            {fullWindow ? "Minimize" : "Full Window"}
          </button>
          <button onClick={handleClear} className="gcp-button" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
            <Trash2 size={12} /> Clear
          </button>
        </div>
      </div>

      {configPanel}

      {webLlmOk === false && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 12px", background: "var(--gcp-yellow-bg)", border: "1px solid var(--gcp-yellow)", borderRadius: 6, fontSize: 11, flexShrink: 0, color: "var(--gcp-text-secondary)" }}>
          <AlertTriangle size={14} style={{ color: "var(--gcp-yellow)", flexShrink: 0, marginTop: 1 }} />
          <div><strong>WebLLM unavailable</strong> — <code style={{ background: "rgba(0,0,0,0.06)", padding: "1px 4px", borderRadius: 3 }}>@mlc-ai/web-llm</code> package not installed. Use <strong>Mock (offline)</strong> for zero-setup or configure <strong>OpenAI</strong> with an API key.</div>
        </div>
      )}

      {webLlmLoading && config.provider === "webllm" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--gcp-blue-bg)", border: "1px solid var(--gcp-blue)", borderRadius: 6, fontSize: 11, flexShrink: 0 }}>
          <Download size={14} style={{ color: "var(--gcp-blue)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>{webLlmStatusText || `Loading ${config.model || "Llama-3.2-1B-Instruct-q4f32_1-MLC"}`}</div>
            <div style={{ height: 4, background: "var(--gcp-grey)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${Math.max(webLlmProgress * 100, 5)}%`, height: "100%", background: "var(--gcp-blue)", borderRadius: 2, transition: "width 0.3s ease" }} />
            </div>
            <div style={{ fontSize: 10, color: "var(--gcp-text-secondary)", marginTop: 2 }}>{(webLlmProgress * 100).toFixed(0)}%</div>
          </div>
        </div>
      )}

      {/* Skill Selector */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
        <button
          onClick={() => setActiveSkill("none")}
          className="gcp-button"
          style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, background: activeSkill === "none" ? "var(--gcp-blue)" : undefined, color: activeSkill === "none" ? "white" : undefined, borderColor: activeSkill === "none" ? "var(--gcp-blue)" : undefined }}
        >
          <Zap size={12} /> General
        </button>
        {skills.map(skill => {
          const Icon = SKILL_ICONS[skill.icon] ?? Bot;
          const isActive = activeSkill === skill.id;
          return (
            <button
              key={skill.id}
              onClick={() => startExample(skill.id)}
              className="gcp-button"
              title={skill.description}
              style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, background: isActive ? "var(--gcp-blue)" : undefined, color: isActive ? "white" : undefined, borderColor: isActive ? "var(--gcp-blue)" : undefined }}
            >
              <Icon size={12} /> {skill.name}
            </button>
          );
        })}
      </div>

      {/* Chat area: main messages + optional thread panel */}
      <div style={{ flex: 1, display: "flex", gap: 0, overflow: "hidden", minHeight: 0 }}>

        {/* Main message list */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <MessageList
            autoScrollToBottom
            scrollBehavior="smooth"
            typingIndicator={loading ? <TypingIndicator content="Thinking..." /> : undefined}
            style={{ flex: 1, "--message-list-background": "transparent" } as React.CSSProperties}
          >
            <MessageList.Content>
            {topLevelMessages.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: "var(--gcp-text-secondary)", padding: 24 }}>
                <Bot size={48} style={{ opacity: 0.3 }} />
                <div style={{ textAlign: "center", maxWidth: 400 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, color: "var(--gcp-text)", marginBottom: 4 }}>How can I help with CDN regression testing?</p>
                  <p style={{ fontSize: 12 }}>Select a skill above to get started, or type your question directly.</p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
                  {skills.map(s => (
                    <div key={s.id} onClick={() => startExample(s.id)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--gcp-grey)", cursor: "pointer", fontSize: 11, maxWidth: 180, background: "var(--gcp-surface-hover)" }}>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>{s.name}</div>
                      <div style={{ color: "var(--gcp-text-secondary)", fontSize: 10 }}>{s.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {topLevelMessages.map(msg => {
              const replies = getThreadReplies(msg.id);
              const testConfig = msg.role === "assistant" ? extractTestConfigFromMessage(msg.content) : null;
              return (
                <div key={msg.id}>
                  <div style={{ display: "flex", gap: 8, flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: msg.role === "user" ? "var(--gcp-blue)" : "var(--gcp-grey-bg)", color: msg.role === "user" ? "white" : "var(--gcp-text)" }}>
                      {msg.role === "user" ? <Lightbulb size={14} /> : <Bot size={14} />}
                    </div>
                    <div style={{ maxWidth: "75%", padding: "8px 12px", borderRadius: 8, background: msg.role === "user" ? "var(--gcp-blue-bg)" : "var(--gcp-surface)", border: msg.role === "user" ? "none" : "1px solid var(--gcp-grey)", fontSize: 12, lineHeight: 1.6 }}>
                      <div style={{ fontWeight: 600, fontSize: 10, color: "var(--gcp-text-secondary)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {msg.role === "user" ? "You" : "AI Copilot"}{msg.skill ? ` · ${skills.find(s => s.id === msg.skill)?.name ?? msg.skill}` : ""}
                      </div>
                      <div style={{ overflowX: "auto" }} className="copilot-markdown">
                        {msg.role === "user" ? (
                          <ReactMarkdown components={MARKDOWN_COMPONENTS}>
                            {linkifyText(msg.content)}
                          </ReactMarkdown>
                        ) : (() => {
                          const { text, blocks } = parseFormBlocks(stripTestConfigBlock(msg.content));
                          return (
                            <>
                              {text && (
                                <ReactMarkdown components={MARKDOWN_COMPONENTS}>
                                  {linkifyText(text)}
                                </ReactMarkdown>
                              )}
                              {blocks.map((block, bi) => {
                                if (submittedForms.has(`${msg.id}_${bi}`)) return null;
                                return (
                                  <ChatFormControls
                                    key={bi}
                                    fields={block.fields}
                                    onSubmit={values => {
                                      handleFormSubmit(`${msg.id}_${bi}`, values);
                                    }}
                                  />
                                );
                              })}
                            </>
                          );
                        })()}
                      </div>
                      {testConfig && (
                        <DraftTestCard config={testConfig} onConfirm={() => handleCreateTestCase(msg.content)} />
                      )}
                      <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {msg.role === "assistant" && testConfig && (
                          <button onClick={() => handleCreateTestCase(msg.content)} className="gcp-button" style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>
                            <FileText size={10} /> Save to Test Manager
                          </button>
                        )}
                        <button
                          onClick={() => setActiveThread(msg.id)}
                          className="gcp-button"
                          style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}
                        >
                          <MessageSquare size={10} /> Reply in Thread
                        </button>
                        <button onClick={() => handleForkThread(msg)} className="gcp-button" style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>
                          <GitBranch size={10} /> Fork
                        </button>
                      </div>
                    </div>
                  </div>
                  {replies.length > 0 && (
                    <div
                      onClick={() => setActiveThread(msg.id)}
                      style={{ marginLeft: 36, marginTop: 4, fontSize: 11, color: "var(--gcp-blue)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, width: "fit-content" }}
                    >
                      <MessageSquare size={12} /> {replies.length} {replies.length === 1 ? "reply" : "replies"} — View thread
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={msgEndRef} />
            </MessageList.Content>
          </MessageList>

          {/* Main input */}
          <div className="gcp-card" style={{ padding: "8px 12px", display: "flex", gap: 8, alignItems: "center", flexShrink: 0, marginTop: 8 }}>
            <input
              className="gcp-input"
              style={{ flex: 1, border: "none", fontSize: 13, outline: "none", background: "transparent" }}
              placeholder={activeSkillDef ? `Ask about ${activeSkillDef.name.toLowerCase()}...` : "Ask anything about CDN test results..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={loading}
            />
            <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="gcp-button gcp-button-primary" style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, opacity: loading || !input.trim() ? 0.5 : 1 }}>
              <Send size={14} />
            </button>
          </div>
        </div>

        {/* Thread panel */}
        {activeThread && (
          <div style={{ width: 380, marginLeft: 12, borderLeft: "1px solid var(--gcp-grey)", paddingLeft: 12, display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid var(--gcp-grey)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <MessageSquare size={14} style={{ color: "var(--gcp-text-secondary)" }} />
                <span style={{ fontSize: 12, fontWeight: 700 }}>
                  Thread · @{(messages.find(m => m.id === activeThread)?.role === "user" ? "You" : "AI Copilot")}
                </span>
              </div>
              <button onClick={() => { setActiveThread(null); setThreadInput(""); }} className="gcp-button" style={{ fontSize: 10, padding: "2px 6px", border: "none", background: "transparent", cursor: "pointer" }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, padding: "8px 0" }}>
              {(() => {
                const parent = messages.find(m => m.id === activeThread);
                const replies = getThreadReplies(activeThread);
                return (
                  <>
                    {parent && (
                      <div key={parent.id} style={{ display: "flex", gap: 8, padding: "8px 10px", borderRadius: 6, background: "var(--gcp-surface)", border: "1px solid var(--gcp-grey)", fontSize: 12, lineHeight: 1.5 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: parent.role === "user" ? "var(--gcp-blue)" : "var(--gcp-grey-bg)", color: parent.role === "user" ? "white" : "var(--gcp-text)" }}>
                          {parent.role === "user" ? <Lightbulb size={12} /> : <Bot size={12} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 4 }}>{parent.role === "user" ? "You" : "AI Copilot"}</div>
                          <ReactMarkdown components={MARKDOWN_COMPONENTS}>{linkifyText(stripTestConfigBlock(parent.content).substring(0, 500))}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                    {replies.map(r => (
                      <div key={r.id} style={{ display: "flex", gap: 6, flexDirection: r.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
                        <div style={{ width: 22, height: 22, borderRadius: 11, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: r.role === "user" ? "var(--gcp-blue)" : "var(--gcp-grey-bg)", color: r.role === "user" ? "white" : "var(--gcp-text)" }}>
                          {r.role === "user" ? "U" : <Bot size={10} />}
                        </div>
                        <div style={{ maxWidth: "85%", padding: "6px 10px", borderRadius: 6, background: r.role === "user" ? "var(--gcp-blue-bg)" : "var(--gcp-grey-bg)", fontSize: 11, lineHeight: 1.5 }}>
                          <div style={{ fontWeight: 600, fontSize: 9, color: "var(--gcp-text-secondary)", marginBottom: 2 }}>{r.role === "user" ? "You" : "AI Copilot"}</div>
                          {r.role === "assistant" ? (() => {
                            const { text, blocks } = parseFormBlocks(stripTestConfigBlock(r.content));
                            return (
                              <>
                                {text && <ReactMarkdown components={MARKDOWN_COMPONENTS}>{linkifyText(text)}</ReactMarkdown>}
                                {blocks.map((block, bi) => {
                                  if (submittedForms.has(`${r.id}_${bi}`)) return null;
                                  return (
                                    <ChatFormControls
                                      key={bi}
                                      fields={block.fields}
                                      onSubmit={values => handleFormSubmit(`${r.id}_${bi}`, values)}
                                    />
                                  );
                                })}
                              </>
                            );
                          })() : (
                            <ReactMarkdown components={MARKDOWN_COMPONENTS}>{linkifyText(r.content)}</ReactMarkdown>
                          )}
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <div style={{ width: 22, height: 22, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--gcp-grey-bg)" }}>
                          <Bot size={10} style={{ color: "var(--gcp-text-secondary)" }} />
                        </div>
                        <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                          <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                          Thinking...
                        </div>
                      </div>
                    )}
                    <div ref={threadEndRef} />
                  </>
                );
              })()}
            </div>
            {/* Thread input */}
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0, padding: "8px 0", borderTop: "1px solid var(--gcp-grey)" }}>
              <input
                className="gcp-input"
                style={{ flex: 1, border: "none", fontSize: 12, outline: "none", background: "transparent" }}
                placeholder="Reply in thread..."
                value={threadInput}
                onChange={e => setThreadInput(e.target.value)}
                onKeyDown={handleThreadKeyDown}
                disabled={loading}
              />
              <button onClick={handleThreadReply} disabled={loading || !threadInput.trim()} className="gcp-button gcp-button-primary" style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, opacity: loading || !threadInput.trim() ? 0.5 : 1 }}>
                <Send size={12} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );

  if (fullWindow) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "var(--gcp-surface)" }}>
        <div dangerouslySetInnerHTML={{ __html: chatscopeTheme }} />
        {mainContent}
      </div>
    );
  }

  return (
    <AppLayout activeHref="/copilot">
      <div dangerouslySetInnerHTML={{ __html: chatscopeTheme }} />
      {mainContent}
    </AppLayout>
  );
}
