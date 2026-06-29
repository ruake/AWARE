import React from "react";
import { CopilotSidebar } from "@/components/aware/CopilotSidebar";
import ChatMessage, { type ChatMsg } from "@/components/aware/ChatMessage";
import { Bot, Send, Sparkles } from "lucide-react";
import { ChromeProvider } from "@/lib/copilot/providers";
import { runAgent } from "@/lib/copilot/agent";
import { TOOLS } from "@/lib/copilot/tools";
import type { Message } from "@/lib/copilot/types";

const provider = new ChromeProvider();

function toChatMsg(m: Message): ChatMsg {
  return { id: m.id, role: m.role, content: m.content || "…" };
}

export default function Copilot() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [providerStatus, setProviderStatus] = React.useState<string>("checking");
  const abortRef = React.useRef<AbortController | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Probe Gemini Nano availability on mount
  React.useEffect(() => {
    console.log("[Copilot] probing Gemini Nano availability…");
    console.log("[Copilot] window.LanguageModel:", (window as any).LanguageModel);
    console.log("[Copilot] window.ai:", (window as any).ai);
    provider.checkAvailability().then((s) => {
      console.log("[Copilot] provider status:", s);
      setProviderStatus(s);
    });
  }, []);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string) => {
    const query = text.trim();
    if (!query || busy) return;

    console.log("[Copilot] handleSend — query:", query);
    console.log("[Copilot] handleSend — providerStatus:", providerStatus);
    console.log("[Copilot] handleSend — history length:", messages.length);

    setInput("");

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: query,
      timestamp: Date.now(),
    };
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      streaming: true,
    };

    const history = [...messages, userMsg];
    setMessages([...history, assistantMsg]);
    setBusy(true);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      console.log("[Copilot] runAgent — starting, tools:", TOOLS.map((t) => t.name));
      await runAgent({
        userContent: query,
        history,
        provider,
        tools: TOOLS,
        signal: ac.signal,
        onEvent: (event) => {
          console.log("[Copilot] agentEvent:", event.type, event);
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (!last || last.role !== "assistant") return prev;

            switch (event.type) {
              case "delta":
                return [...prev.slice(0, -1), { ...last, content: last.content + event.content }];
              case "tool_start":
                console.log("[Copilot] tool_start:", event.toolCall.name, event.toolCall.args);
                return [...prev.slice(0, -1), { ...last, toolCalls: [...(last.toolCalls ?? []), event.toolCall] }];
              case "tool_done":
                console.log("[Copilot] tool_done:", event.toolCall.name, "status:", event.toolCall.status);
                return [...prev.slice(0, -1), { ...last, toolCalls: last.toolCalls?.map((tc) => tc.id === event.toolCall.id ? event.toolCall : tc) }];
              case "done":
                console.log("[Copilot] done — final content length:", last.content.length);
                return [...prev.slice(0, -1), { ...last, streaming: false }];
              case "error":
                console.error("[Copilot] error event:", event.error);
                return [...prev.slice(0, -1), { ...last, streaming: false, content: last.content || `Error: ${event.error}` }];
              default:
                return prev;
            }
          });
        },
      });
      console.log("[Copilot] runAgent — completed");
    } catch (e) {
      console.error("[Copilot] runAgent — threw:", e);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.streaming) return [...prev.slice(0, -1), { ...last, streaming: false }];
        return prev;
      });
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const handleNewChat = () => {
    console.log("[Copilot] new chat — aborting in-flight request");
    abortRef.current?.abort();
    setMessages([]);
    setBusy(false);
  };

  const isTyping = busy && messages.at(-1)?.streaming;

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <CopilotSidebar onNewChat={handleNewChat} onSend={handleSend} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--proof-bg)", position: "relative" }}>

        {/* Provider status badge */}
        {providerStatus !== "checking" && (
          <div style={{ position: "absolute", top: 12, right: 16, fontSize: 11, padding: "4px 12px", borderRadius: "var(--proof-radius-full)", background: providerStatus === "available" ? "var(--proof-green-bg)" : "var(--proof-surface-3)", border: `1px solid ${providerStatus === "available" ? "var(--proof-green-border)" : "var(--proof-border)"}`, color: providerStatus === "available" ? "var(--proof-green)" : "var(--proof-text-muted)", zIndex: 10, display: "flex", alignItems: "center", gap: 6, backdropFilter: "blur(8px)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: providerStatus === "available" ? "var(--proof-green)" : "var(--proof-text-muted)", boxShadow: providerStatus === "available" ? "0 0 8px var(--proof-green)" : "none" }} />
            {providerStatus === "available" ? "Gemini Nano: Available" : providerStatus === "downloading" ? "Gemini Nano downloading…" : "Gemini Nano: Unavailable"}
          </div>
        )}

        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "40px 20px", scrollBehavior: "smooth" }}>
          {messages.length === 0 ? (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--proof-text-secondary)", animation: "fade-in 0.6s ease-out" }}>
              <div style={{ position: "relative", marginBottom: 32 }}>
                <div style={{ position: "absolute", inset: -20, background: "var(--proof-blue-glow)", filter: "blur(40px)", borderRadius: "50%", opacity: 0.3 }} />
                <Bot size={64} style={{ color: "var(--proof-blue)", position: "relative" }} />
              </div>
              <h2 style={{ fontSize: 32, fontWeight: 800, color: "var(--proof-text)", marginBottom: 12, letterSpacing: "-1px", background: "linear-gradient(to bottom, #fff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>A.W.A.R.E. Copilot</h2>
              <p style={{ fontSize: 16, maxWidth: 500, textAlign: "center", marginBottom: 40, color: "var(--proof-text-secondary)", lineHeight: 1.6 }}>Your AI assistant for analyzing test runs, detecting anomalies, and diagnosing infrastructure issues.</p>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, width: "100%", maxWidth: 800, padding: "0 20px" }}>
                {[
                  { label: "Summarize latest failures", icon: "📊" },
                  { label: "Compare last two runs", icon: "⚖️" },
                  { label: "Show flaky tests", icon: "🧪" }
                ].map((s, i) => (
                  <button key={i} onClick={() => handleSend(s.label)} className="glass-panel"
                    style={{ 
                      padding: "20px", 
                      borderRadius: "var(--proof-radius-lg)", 
                      background: "var(--proof-surface-2)", 
                      border: "1px solid var(--proof-border)", 
                      color: "var(--proof-text)", 
                      fontSize: 14, 
                      cursor: "pointer", 
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 12,
                      textAlign: "center"
                    }}
                    onMouseEnter={(e) => { 
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.borderColor = "var(--proof-blue)"; 
                      e.currentTarget.style.boxShadow = "var(--proof-glow-cyan)";
                    }}
                    onMouseLeave={(e) => { 
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.borderColor = "var(--proof-border)"; 
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{s.icon}</span>
                    <span style={{ fontWeight: 600 }}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              {messages.map((msg, idx) => (
                <ChatMessage key={msg.id} msg={toChatMsg(msg)} index={idx} />
              ))}
              {isTyping && (
                <div style={{ display: "flex", gap: 16, padding: "24px 0", animation: "fade-in 0.3s ease-out" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--proof-blue-bg)", border: "1px solid var(--proof-blue-border)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--proof-glow-cyan)" }}>
                    <Bot size={18} style={{ color: "var(--proof-blue)" }} />
                  </div>
                  <div className="glass-panel" style={{ padding: "16px 24px", borderRadius: "4px 16px 16px 16px", borderLeft: "3px solid var(--proof-blue)", display: "flex", alignItems: "center", gap: 6, background: "var(--proof-glass)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--proof-blue)", animation: "blink 1.4s infinite" }} />
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--proof-blue)", animation: "blink 1.4s infinite 0.2s" }} />
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--proof-blue)", animation: "blink 1.4s infinite 0.4s" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{ padding: "20px 40px 40px", background: "linear-gradient(to top, var(--proof-bg) 60%, transparent)" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", position: "relative" }}>
            <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} style={{ position: "relative" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(input);
                  }
                }}
                placeholder="Ask Copilot anything… (Shift+Enter for new line)"
                className="proof-input"
                disabled={busy}
                rows={1}
                style={{ 
                  width: "100%", 
                  padding: "16px 60px 16px 20px", 
                  borderRadius: "var(--proof-radius-xl)", 
                  border: "1px solid var(--proof-border)", 
                  fontSize: 15, 
                  color: "white", 
                  outline: "none", 
                  transition: "all 0.2s", 
                  boxShadow: "var(--proof-shadow-lg)",
                  background: "var(--proof-surface-2)",
                  resize: "none",
                  minHeight: "56px",
                  maxHeight: "200px"
                }}
                onFocus={(e) => { 
                  e.target.style.borderColor = "var(--proof-blue)"; 
                  e.target.style.boxShadow = "0 0 0 3px rgba(0,196,255,0.15), var(--proof-shadow-lg)"; 
                }}
                onBlur={(e) => { 
                  e.target.style.borderColor = "var(--proof-border)"; 
                  e.target.style.boxShadow = "var(--proof-shadow-lg)"; 
                }}
              />
              <button 
                type="submit" 
                disabled={!input.trim() || busy}
                style={{ 
                  position: "absolute", 
                  right: 10, 
                  bottom: 10, 
                  width: 36, 
                  height: 36, 
                  borderRadius: "var(--proof-radius-md)", 
                  background: input.trim() && !busy ? "var(--proof-blue)" : "var(--proof-surface-3)", 
                  border: "none", 
                  color: "white", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  cursor: input.trim() && !busy ? "pointer" : "not-allowed", 
                  transition: "all 0.2s", 
                  boxShadow: input.trim() && !busy ? "0 0 12px var(--proof-blue-glow)" : "none",
                  animation: busy ? "pulse-glow 2s infinite" : "none"
                }}
              >
                {busy ? <div className="animate-spin" style={{ width: 16, height: 16, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%" }} /> : <Send size={18} />}
              </button>
            </form>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, padding: "0 4px" }}>
              <div style={{ fontSize: 11, color: "var(--proof-text-muted)", fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", gap: 4 }}>
                <Sparkles size={12} style={{ color: "var(--proof-blue)" }} />
                AI-Powered Insights
              </div>
              <div style={{ fontSize: 11, color: "var(--proof-text-muted)", fontFamily: "var(--font-mono)" }}>
                {input.length} characters
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
