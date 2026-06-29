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
          <div style={{ position: "absolute", top: 12, right: 16, fontSize: 11, padding: "3px 10px", borderRadius: "var(--proof-radius-full)", background: providerStatus === "available" ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)", border: `1px solid ${providerStatus === "available" ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.1)"}`, color: providerStatus === "available" ? "#4ade80" : "var(--proof-text-muted)", zIndex: 10 }}>
            {providerStatus === "available" ? "● Gemini Nano" : providerStatus === "downloading" ? "⬇ Gemini Nano downloading…" : "○ Gemini Nano unavailable"}
          </div>
        )}

        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 40px", scrollBehavior: "smooth" }}>
          {messages.length === 0 ? (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--proof-text-secondary)" }}>
              <Sparkles size={48} style={{ color: "var(--proof-blue)", opacity: 0.5, marginBottom: 24 }} />
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--proof-text)", marginBottom: 8, letterSpacing: "-0.5px" }}>A.W.A.R.E. Copilot</h2>
              <p style={{ fontSize: 14, maxWidth: 400, textAlign: "center", marginBottom: 32 }}>Your AI assistant for analyzing test runs, detecting anomalies, and diagnosing infrastructure issues.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", maxWidth: 600 }}>
                {["Summarize the latest PROD run", "Which tests are currently flaky?", "Show me performance trends", "Are there any active anomalies?"].map((s, i) => (
                  <button key={i} onClick={() => handleSend(s)} className="glass-panel"
                    style={{ padding: "10px 16px", borderRadius: "var(--proof-radius-full)", background: "rgba(255,255,255,0.03)", border: "1px solid var(--proof-border)", color: "var(--proof-text)", fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,196,255,0.1)"; e.currentTarget.style.borderColor = "var(--proof-blue)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "var(--proof-border)"; }}
                  >{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              {messages.map((msg, idx) => (
                <ChatMessage key={msg.id} msg={toChatMsg(msg)} index={idx} />
              ))}
              {isTyping && (
                <div style={{ display: "flex", gap: 16, padding: "24px 0" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,196,255,0.1)", border: "1px solid rgba(0,196,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--proof-glow-cyan)" }}>
                    <Bot size={18} style={{ color: "var(--proof-blue)" }} />
                  </div>
                  <div className="glass-panel" style={{ padding: "16px 24px", borderRadius: "4px 16px 16px 16px", borderLeft: "3px solid var(--proof-blue)", display: "flex", alignItems: "center", gap: 6 }}>
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
        <div style={{ padding: "20px 40px", background: "linear-gradient(to top, var(--proof-bg) 60%, transparent)" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", position: "relative" }}>
            <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Copilot anything…"
                className="glass-panel"
                disabled={busy}
                style={{ width: "100%", padding: "16px 56px 16px 20px", borderRadius: "var(--proof-radius-xl)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 15, color: "white", outline: "none", transition: "all 0.2s", boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}
                onFocus={(e) => { e.target.style.borderColor = "var(--proof-blue)"; e.target.style.boxShadow = "var(--proof-glow-cyan)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)"; }}
              />
              <button type="submit" disabled={!input.trim() || busy}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", background: input.trim() && !busy ? "var(--proof-blue)" : "var(--proof-surface-3)", border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: input.trim() && !busy ? "pointer" : "not-allowed", transition: "all 0.2s", boxShadow: input.trim() && !busy ? "0 0 12px var(--proof-blue)" : "none" }}>
                <Send size={16} />
              </button>
            </form>
            <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "var(--proof-text-muted)", fontFamily: "var(--font-mono)" }}>
              Powered by Gemini Nano · AI can make mistakes. Verify critical information.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
