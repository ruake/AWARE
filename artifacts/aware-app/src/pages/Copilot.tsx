import React from "react";
import { AppLayout } from "@/components/aware/AppLayout";
import {
  Bot, Send, Sparkles, FileCode, Search, GitCompare,
  FolderTree, Settings2, Trash2, Loader2, CheckCircle2,
  AlertTriangle, Info, Lightbulb, Zap, RefreshCw,
} from "lucide-react";
import { llmChat, getLLMConfig, setLLMConfig, clearChatHistory, getRegisteredSkills, generateTestsWithLLM } from "@/lib/llm";
import type { LLMConfig, LLMSkillDefinition, LLMChatMessage } from "@/lib/types";
import { navTo } from "@/lib/nav";

type SkillOption = "none" | LLMSkillDefinition["id"];

const SKILL_ICONS: Record<string, React.ComponentType<any>> = {
  Sparkles, FileCode, Search, GitCompare, FolderTree,
};

export default function Copilot() {
  const [messages, setMessages] = React.useState<LLMChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [activeSkill, setActiveSkill] = React.useState<SkillOption>("none");
  const [showConfig, setShowConfig] = React.useState(false);
  const [config, setConfig] = React.useState<LLMConfig>(getLLMConfig());

  const skills = getRegisteredSkills();
  const activeSkillDef = skills.find(s => s.id === activeSkill);
  const msgEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: LLMChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
      skill: activeSkill,
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await llmChat(text, activeSkillDef?.systemPrompt);
      const assistantMsg: LLMChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        role: "assistant",
        content: res.content,
        timestamp: Date.now(),
        skill: activeSkill,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg: LLMChatMessage = {
        id: `msg_${Date.now()}_err`,
        role: "assistant",
        content: `Error: ${err instanceof Error ? err.message : "Request failed"}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    clearChatHistory();
    setMessages([]);
  };

  const handleConfigSave = () => {
    setLLMConfig(config);
    setShowConfig(false);
  };

  const handleGenerateFromMsg = async (msg: string) => {
    if (!msg.includes("test") && !msg.includes("Test")) return;
    try {
      const result = await generateTestsWithLLM({
        count: 3,
        category: "general",
        description: msg.substring(0, 200),
        suites: [],
      });
      const confirmMsg: LLMChatMessage = {
        id: `msg_${Date.now()}_confirm`,
        role: "assistant",
        content: `✅ Created **${result.length} test cases** from this analysis.`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, confirmMsg]);
    } catch {
      // silent
    }
  };

  const startExample = (skillId: SkillOption) => {
    setActiveSkill(skillId);
    setInput("");
    const examples: Record<string, string> = {
      "generate-tests": "Generate 5 test cases for CDN cache validation including edge routing and origin shield scenarios",
      "generate-script": "Write a Playwright test script that validates cache HIT/MISS headers across multiple edge locations",
      "analyze-results": "Analyze these test failures: 12 cache tests failed with MISS instead of HIT, 3 geo-routing tests timed out for APAC region",
      "explain-diff": "Explain the diff between baseline and candidate where we see 7 new regressions in caching and 4 fixed tests in security",
      "generate-suite": "Generate a suite config for CDN migration testing with Slack notifications, 4 parallel workers, and 2 retries",
    };
    if (skillId !== "none") {
      setInput(examples[skillId] ?? "");
    }
  };

  return (
    <AppLayout activeHref="/copilot">
      <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "calc(100vh - 100px)" }}>

        {/* Header */}
        <div className="gcp-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Bot size={20} style={{ color: "var(--gcp-blue)" }} />
            <span style={{ fontWeight: 700, fontSize: 14 }}>AI Copilot</span>
            <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)", padding: "2px 6px", background: "var(--gcp-grey-bg)", borderRadius: 4 }}>
              {getLLMConfig().provider === "mock" ? "Mock (offline)" : getLLMConfig().model}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={() => setShowConfig(p => !p)} className="gcp-button" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
              <Settings2 size={12} /> Config
            </button>
            <button onClick={handleClear} className="gcp-button" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
              <Trash2 size={12} /> Clear
            </button>
          </div>
        </div>

        {/* Config Panel */}
        {showConfig && (
          <div className="gcp-card" style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10, flexShrink: 0, border: "1px solid var(--gcp-blue)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>Provider</label>
                <select className="gcp-input" style={{ width: "100%", fontSize: 11 }} value={config.provider} onChange={e => setConfig(p => ({ ...p, provider: e.target.value as LLMConfig["provider"] }))}>
                  <option value="mock">Mock (offline)</option>
                  <option value="openai">OpenAI / Compatible</option>
                  <option value="webllm">WebLLM (WebGPU)</option>
                </select>
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
        )}

        {/* Skill Selector + Suggestions */}
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

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, padding: "4px 0" }}>
          {messages.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: "var(--gcp-text-secondary)" }}>
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
          {messages.map(msg => (
            <div key={msg.id} style={{ display: "flex", gap: 8, flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: msg.role === "user" ? "var(--gcp-blue)" : "var(--gcp-grey-bg)", color: msg.role === "user" ? "white" : "var(--gcp-text)" }}>
                {msg.role === "user" ? <Lightbulb size={14} /> : <Bot size={14} />}
              </div>
              <div style={{ maxWidth: "75%", padding: "8px 12px", borderRadius: 8, background: msg.role === "user" ? "var(--gcp-blue-bg)" : "var(--gcp-surface)", border: msg.role === "user" ? "none" : "1px solid var(--gcp-grey)", fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: msg.content.includes("```") ? "var(--font-mono)" : undefined }}>
                <div style={{ fontWeight: 600, fontSize: 10, color: "var(--gcp-text-secondary)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {msg.role === "user" ? "You" : "AI Copilot"}{msg.skill ? ` · ${skills.find(s => s.id === msg.skill)?.name ?? msg.skill}` : ""}
                </div>
                <div style={{ overflowX: "auto" }}>{msg.content}</div>
                {msg.role === "assistant" && msg.content.toLowerCase().includes("test") && (
                  <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                    <button onClick={() => handleGenerateFromMsg(msg.content)} className="gcp-button" style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>
                      <Sparkles size={10} /> Create Test Cases
                    </button>
                    <button onClick={() => { navTo("/tests"); }} className="gcp-button" style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>
                      <FolderTree size={10} /> Open Test Manager
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--gcp-grey-bg)" }}>
                <Bot size={14} style={{ color: "var(--gcp-text-secondary)" }} />
              </div>
              <div style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--gcp-grey)", fontSize: 12, color: "var(--gcp-text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                Thinking...
              </div>
            </div>
          )}
          <div ref={msgEndRef} />
        </div>

        {/* Input */}
        <div className="gcp-card" style={{ padding: "8px 12px", display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <input
            className="gcp-input"
            style={{ flex: 1, border: "none", fontSize: 13, outline: "none", background: "transparent" }}
            placeholder={activeSkillDef ? `Ask about ${activeSkillDef.name.toLowerCase()}...` : "Ask anything about CDN test results..."}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button onClick={handleSend} disabled={loading || !input.trim()} className="gcp-button gcp-button-primary" style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, opacity: loading || !input.trim() ? 0.5 : 1 }}>
            <Send size={14} />
          </button>
        </div>

      </div>
    </AppLayout>
  );
}
