import React from "react";
import {
  Bot, Send, X, Loader2, Sparkles, Zap, Trash2,
} from "lucide-react";
import { llmChat, getLLMConfig, setLLMConfig, getRegisteredSkills, clearChatHistory, syncChatHistory, checkChromeAI, checkWebLLM } from "@/lib/llm";
import { createTestCase } from "@/lib/testCases";
import { PROJECT_CONTEXT } from "@/lib/skills";
import type { LLMSkillDefinition, LLMChatMessage, LLMConfig } from "@/lib/types";
import { navTo } from "@/lib/nav";
import ReactMarkdown from "react-markdown";
import { saveChatMessages, loadChatMessages, clearChatMessages } from "@/lib/chatStorage";

type SkillOption = "none" | LLMSkillDefinition["id"];

export function CopilotChatBubble() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<LLMChatMessage[]>(() => {
    const loaded = loadChatMessages();
    if (loaded.length > 0) {
      syncChatHistory(loaded.map(m => ({ role: m.role, content: m.content })));
    }
    return loaded;
  });
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [activeSkill, setActiveSkill] = React.useState<SkillOption>("none");
  const [showConfig, setShowConfig] = React.useState(false);
  const [webLlmOk, setWebLlmOk] = React.useState<boolean | null>(null);
  const [chromeOk, setChromeOk] = React.useState<boolean | null>(null);
  const configRef = React.useRef<HTMLDivElement>(null);
  const msgEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    checkWebLLM().then(setWebLlmOk);
    checkChromeAI().then(setChromeOk);
  }, []);

  React.useEffect(() => {
    if (!showConfig) return;
    const handler = (e: MouseEvent) => {
      if (configRef.current && !configRef.current.contains(e.target as Node)) setShowConfig(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showConfig]);

  const skills = getRegisteredSkills();
  const activeSkillDef = skills.find(s => s.id === activeSkill);

  const updateMessages = (fn: (prev: LLMChatMessage[]) => LLMChatMessage[]) => {
    setMessages(prev => {
      const next = fn(prev);
      saveChatMessages(next);
      return next;
    });
  };

  const handleClear = () => {
    clearChatHistory();
    clearChatMessages();
    setMessages([]);
  };

  React.useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: LLMChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    updateMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await llmChat(text, activeSkillDef?.systemPrompt ?? PROJECT_CONTEXT);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCreateTests = async (content: string) => {
    const lines = content.split("\n");
    const names: string[] = [];
    for (const line of lines) {
      const match = line.match(/^\d+\.\s*\*{0,2}([^*\d][^*]+?)\*{0,2}/);
      if (match) {
        names.push(match[1].trim().replace(/:$/, ""));
      }
    }
    const extracted = names.length > 0 ? names.slice(0, 5) : [`Test from: ${content.slice(0, 60).trim()}`];
    const ids: string[] = [];
    for (const name of extracted) {
      try {
        const tc = createTestCase({
          name,
          description: content.slice(0, 300),
          category: "general",
          priority: "P2",
          severity: "minor",
          status: "active",
          tags: ["ai-generated"],
          owner: "ai-copilot",
          suiteIds: [],
          automated: false,
          scriptPath: `tests/generated/ai/${name.toLowerCase().replace(/\s+/g, "_")}.yaml`,
          preconditions: "",
          expectedBehavior: "",
          documentation: content,
          relatedTestIds: [],
          requestHeaders: {},
          cookies: {},
          expectedStatus: 200,
          captureResponseHeaders: [],
          filmstrip: { enabled: false, threshold: 0.99 },
          predicates: [],
          testType: "web",
          config: {},
          assertions: [],
          version: 1,
          changelog: [],
        });
        ids.push(tc.id);
      } catch { /* skip failed */ }
    }
    if (ids.length > 0) {
      navTo(`/tests?sel=${ids[0]}`);
    }
  };

  return (
    <>
      {/* Bubble button */}
      <button
        onClick={() => setOpen(p => !p)}
        title="AI Copilot"
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 999,
          width: 52, height: 52, borderRadius: "50%",
          background: "var(--gcp-blue)", color: "white",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          transition: "transform 0.2s",
          transform: open ? "scale(0.9)" : "scale(1)",
        }}
      >
        {open ? <X size={22} /> : <Bot size={22} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: 88, right: 24, zIndex: 999,
          width: 380, height: 520,
          background: "var(--gcp-surface)",
          border: "1px solid var(--gcp-grey)",
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column",
          animation: "slide-up 0.2s ease-out",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "10px 14px",
            borderBottom: "1px solid var(--gcp-grey)",
            display: "flex", alignItems: "center", gap: 8,
            background: "var(--gcp-blue-bg)",
            flexShrink: 0,
          }}>
            <Bot size={16} style={{ color: "var(--gcp-blue)" }} />
            <span style={{ fontWeight: 700, fontSize: 13, flex: 1 }}>AI Copilot</span>
            <div ref={configRef} style={{ position: "relative" }}>
              <span
                onClick={() => setShowConfig(p => !p)}
                style={{ fontSize: 10, color: "var(--gcp-text-secondary)", padding: "2px 6px", background: "var(--gcp-grey-bg)", borderRadius: 4, cursor: "pointer" }}
              >
                {getLLMConfig().provider === "mock" ? "Mock" : getLLMConfig().provider === "chrome" ? "Chrome AI" : getLLMConfig().model}
              </span>
              {showConfig && (
                <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: "var(--gcp-surface)", border: "1px solid var(--gcp-grey)", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", zIndex: 10, padding: 4, minWidth: 160 }}>
                  {(["mock", "chrome", "webllm", "openai"] as const).map(p => {
                    const cfg = getLLMConfig();
                    const active = cfg.provider === p;
                    const avail = p === "chrome" ? chromeOk : p === "webllm" ? webLlmOk : true;
                    return (
                      <div
                        key={p}
                        onClick={() => { if (avail !== false) { setLLMConfig({ provider: p }); setShowConfig(false); } }}
                        style={{ padding: "6px 10px", fontSize: 11, borderRadius: 4, cursor: avail === false ? "not-allowed" : "pointer", background: active ? "var(--gcp-blue)" : "transparent", color: active ? "white" : avail === false ? "var(--gcp-text-secondary)" : "var(--gcp-text)", display: "flex", alignItems: "center", gap: 6, opacity: avail === false ? 0.5 : 1 }}
                      >
                        {p === "mock" ? "Mock (offline)" : p === "chrome" ? "Chrome AI" : p === "webllm" ? "WebLLM" : "OpenAI"}
                        {avail === false && <span style={{ marginLeft: "auto", fontSize: 9 }}>unavail</span>}
                        {active && <span style={{ marginLeft: "auto" }}>✓</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {messages.length > 0 && (
              <button onClick={handleClear} style={{ padding: 2, border: "none", background: "transparent", cursor: "pointer", color: "var(--gcp-text-secondary)" }} title="Clear chat">
                <Trash2 size={12} />
              </button>
            )}
          </div>

          {/* Skills row */}
          <div style={{ display: "flex", gap: 4, padding: "6px 10px", borderBottom: "1px solid var(--gcp-grey)", flexShrink: 0, overflowX: "auto" }}>
            <button
              onClick={() => setActiveSkill("none")}
              style={{
                fontSize: 10, padding: "3px 8px", borderRadius: 10, border: "1px solid var(--gcp-grey)",
                cursor: "pointer", whiteSpace: "nowrap",
                background: activeSkill === "none" ? "var(--gcp-blue)" : "transparent",
                color: activeSkill === "none" ? "white" : "var(--gcp-text-secondary)",
              }}
            ><Zap size={10} style={{ display: "inline", marginRight: 3 }} />General</button>
            {skills.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSkill(s.id)}
                style={{
                  fontSize: 10, padding: "3px 8px", borderRadius: 10, border: "1px solid var(--gcp-grey)",
                  cursor: "pointer", whiteSpace: "nowrap",
                  background: activeSkill === s.id ? "var(--gcp-blue)" : "transparent",
                  color: activeSkill === s.id ? "white" : "var(--gcp-text-secondary)",
                }}
              >{s.name}</button>
            ))}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
            {messages.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 6, color: "var(--gcp-text-secondary)", textAlign: "center", padding: "0 16px" }}>
                <Bot size={32} style={{ opacity: 0.2 }} />
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--gcp-text)" }}>CDN Regression Assistant</p>
                <p style={{ fontSize: 11 }}>Ask about test results, generate test cases, or analyze diffs.</p>
              </div>
            )}
            {(() => {
              const threads: { user: LLMChatMessage; assistant: LLMChatMessage[] }[] = [];
              let curUser: LLMChatMessage | null = null;
              let curAssistants: LLMChatMessage[] = [];
              for (const m of messages) {
                if (m.role === "user") {
                  if (curUser) threads.push({ user: curUser, assistant: curAssistants });
                  curUser = m;
                  curAssistants = [];
                } else {
                  curAssistants.push(m);
                }
              }
              if (curUser) threads.push({ user: curUser, assistant: curAssistants });
              else if (curAssistants.length > 0) {
                for (const a of curAssistants) threads.push({ user: a, assistant: [] });
              }
              return threads.map((t, ti) => (
                <div key={t.user.id || ti} style={{ display: "flex", gap: 0, position: "relative" }}>
                  {/* Thread line */}
                  <div style={{ width: 24, display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 4 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: t.user.role === "user" ? "var(--gcp-blue)" : "var(--gcp-grey-bg)", color: t.user.role === "user" ? "white" : "var(--gcp-text)", fontSize: 10 }}>
                      {t.user.role === "user" ? "U" : <Bot size={12} />}
                    </div>
                    {t.assistant.length > 0 && <div style={{ width: 2, flex: 1, minHeight: 8, background: "var(--gcp-grey)", marginTop: 2, borderRadius: 1 }} />}
                  </div>
                  {/* Messages */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, paddingLeft: 6 }}>
                    <div key={t.user.id} style={{ display: "flex", flexDirection: "row-reverse" }}>
                      <div style={{
                        maxWidth: "82%", padding: "6px 10px", borderRadius: 8,
                        background: "var(--gcp-blue-bg)",
                        fontSize: 12, lineHeight: 1.5, overflowX: "auto",
                      }}>
                        {t.user.content}
                      </div>
                    </div>
                    {t.assistant.map((a, ai) => (
                      <div key={a.id} style={{ display: "flex", flexDirection: "row" }}>
                        <div style={{
                          maxWidth: "92%", padding: "6px 10px", borderRadius: 8,
                          background: "var(--gcp-grey-bg)",
                          fontSize: 12, lineHeight: 1.5, overflowX: "auto",
                        }}>
                          <ReactMarkdown
                            components={{
                              code: ({ className, children, ...props }: React.ComponentPropsWithoutRef<"code"> & { className?: string }) => {
                                if (!className) return <code style={{ background: "rgba(0,0,0,0.06)", padding: "1px 3px", borderRadius: 2, fontSize: 11 }} {...props}>{children}</code>;
                                return <pre style={{ background: "rgba(0,0,0,0.06)", padding: 6, borderRadius: 4, overflowX: "auto", fontSize: 11, margin: "4px 0" }}><code className={className} {...props}>{children}</code></pre>;
                              },
                              strong: ({ children }: { children: React.ReactNode }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
                              ul: ({ children }: { children: React.ReactNode }) => <ul style={{ paddingLeft: 14, margin: "2px 0" }}>{children}</ul>,
                              ol: ({ children }: { children: React.ReactNode }) => <ol style={{ paddingLeft: 14, margin: "2px 0" }}>{children}</ol>,
                              li: ({ children }: { children: React.ReactNode }) => <li style={{ marginBottom: 1 }}>{children}</li>,
                              p: ({ children }: { children: React.ReactNode }) => <p style={{ margin: "2px 0" }}>{children}</p>,
                              h1: ({ children }: { children: React.ReactNode }) => <div style={{ fontSize: 13, fontWeight: 700, margin: "6px 0 2px" }}>{children}</div>,
                              h2: ({ children }: { children: React.ReactNode }) => <div style={{ fontSize: 12, fontWeight: 700, margin: "4px 0 2px" }}>{children}</div>,
                              h3: ({ children }: { children: React.ReactNode }) => <div style={{ fontSize: 11, fontWeight: 700, margin: "3px 0 1px" }}>{children}</div>,
                              table: ({ children }: { children: React.ReactNode }) => <div style={{ overflowX: "auto" }}><table style={{ borderCollapse: "collapse", width: "100%", fontSize: 10, margin: "4px 0" }}>{children}</table></div>,
                              th: ({ children }: { children: React.ReactNode }) => <th style={{ border: "1px solid var(--gcp-grey)", padding: "2px 4px", background: "rgba(0,0,0,0.04)", fontWeight: 600 }}>{children}</th>,
                              td: ({ children }: { children: React.ReactNode }) => <td style={{ border: "1px solid var(--gcp-grey)", padding: "2px 4px" }}>{children}</td>,
                            }}
                          >
                            {a.content}
                          </ReactMarkdown>
                          <div style={{ marginTop: 6, display: "flex", gap: 4 }}>
                            <button onClick={() => handleCreateTests(a.content)} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, border: "1px solid var(--gcp-blue)", background: "var(--gcp-blue)", color: "white", cursor: "pointer" }}>
                              <Sparkles size={10} style={{ display: "inline", marginRight: 3 }} />Add to Tests
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
            {loading && (
              <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "4px 0" }}>
                <div style={{ width: 24, height: 24, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--gcp-grey-bg)" }}>
                  <Bot size={12} style={{ color: "var(--gcp-text-secondary)" }} />
                </div>
                <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={msgEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "8px 10px", borderTop: "1px solid var(--gcp-grey)", display: "flex", gap: 6, flexShrink: 0 }}>
            <input
              style={{ flex: 1, padding: "6px 10px", fontSize: 12, border: "1px solid var(--gcp-grey)", borderRadius: 6, outline: "none", background: "var(--gcp-grey-bg)", color: "var(--gcp-text)" }}
              placeholder={activeSkillDef ? `Ask about ${activeSkillDef.name.toLowerCase()}...` : "Ask about CDN tests..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button onClick={handleSend} disabled={loading || !input.trim()} style={{ width: 32, height: 32, borderRadius: 6, border: "none", background: "var(--gcp-blue)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: loading || !input.trim() ? 0.5 : 1 }}>
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
