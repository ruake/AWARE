import React from "react";
import { AppLayout } from "@/components/aware/AppLayout";
import { Send, Bot, User, AlertCircle } from "lucide-react";

declare global {
  interface Window {
    ai?: {
      languageModel: {
        capabilities: () => Promise<{ available: string }>;
        create: (options?: { systemPrompt?: string }) => Promise<{
          prompt: (text: string) => Promise<string>;
          promptStreaming: (text: string) => AsyncIterable<string>;
          destroy: () => void;
        }>;
      };
    };
  }
}

export default function Copilot() {
  const [aiReady, setAiReady] = React.useState(false);
  const [session, setSession] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [messages, setMessages] = React.useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    initAI();
    async function initAI() {
      try {
        if (typeof window !== "undefined" && (window as any).ai?.languageModel) {
          const caps = await (window as any).ai.languageModel.capabilities();
          if (caps.available !== "no") {
            const s = await (window as any).ai.languageModel.create({
              systemPrompt: "You are PROOF Copilot, an AI assistant for a CDN observability dashboard. Answer questions about test runs, deployment health, and CDN performance. Be concise and technical.",
            });
            setSession(s);
            setAiReady(true);
            setMessages([{ role: "assistant", content: "Hello! I'm PROOF Copilot, powered by Chrome's built-in AI. Ask me about test runs, CDN health, or deployment status." }]);
          }
        }
      } catch (e) {
        console.warn("Chrome built-in AI not available:", e);
      } finally {
        setLoading(false);
      }
    }
    return () => { session?.destroy(); };
  }, []);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || busy || !session) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setBusy(true);
    try {
      let response: string;
      if (typeof session.promptStreaming === "function") {
        const stream = await session.promptStreaming(userMsg);
        setMessages(prev => [...prev, { role: "assistant", content: "" }]);
        for await (const chunk of stream) {
          response = chunk;
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1] = { role: "assistant", content: response };
            return next;
          });
        }
      } else {
        response = await session.prompt(userMsg);
        setMessages(prev => [...prev, { role: "assistant", content: response }]);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${e.message}` }]);
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

  if (loading) {
    return (
      <AppLayout activeHref="/copilot">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div className="proof-skeleton" style={{ width: 36, height: 36, borderRadius: "50%" }} />
        </div>
      </AppLayout>
    );
  }

  if (!aiReady) {
    return (
      <AppLayout activeHref="/copilot">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16, padding: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--proof-yellow-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertCircle size={28} style={{ color: "var(--proof-yellow)" }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--proof-text)", margin: 0 }}>Chrome Built-in AI Not Available</h2>
          <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", maxWidth: 480, textAlign: "center", lineHeight: 1.6 }}>
            PROOF Copilot requires Chrome 128+ with the built-in Gemini Nano LLM enabled.
            Open <code style={{ background: "var(--proof-grey-bg)", padding: "2px 6px", borderRadius: 3, fontFamily: "var(--font-mono)" }}>chrome://flags/#optimization-guide-on-device-model</code>
            and set it to <strong>Enabled BypassPrefRequirement</strong>, then restart Chrome.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeHref="/copilot">
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 96px)", maxWidth: 800, margin: "0 auto", gap: 0 }}>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, padding: "16px 0" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", alignSelf: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "80%" }}>
              {msg.role === "assistant" && (
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--proof-blue-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Bot size={14} style={{ color: "var(--proof-blue)" }} />
                </div>
              )}
              <div style={{
                padding: "10px 14px", borderRadius: 10, fontSize: 13, lineHeight: 1.6,
                background: msg.role === "user" ? "var(--proof-blue)" : "var(--proof-grey-bg)",
                color: msg.role === "user" ? "white" : "var(--proof-text)",
                border: msg.role === "user" ? "none" : "1px solid var(--proof-grey)",
              }}>
                {msg.content || (busy && i === messages.length - 1 ? "..." : "")}
              </div>
              {msg.role === "user" && (
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--proof-blue)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <User size={14} style={{ color: "white" }} />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div style={{ display: "flex", gap: 8, padding: "12px 0", borderTop: "1px solid var(--proof-grey)" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about test runs, CDN health..."
            rows={2}
            style={{
              flex: 1, padding: "10px 14px", fontSize: 13, borderRadius: 8,
              border: "1px solid var(--proof-grey)", resize: "none",
              background: "var(--proof-surface)", color: "var(--proof-text)",
              fontFamily: "var(--font-sans)", outline: "none",
            }}
          />
          <button
            onClick={handleSend}
            disabled={busy || !input.trim()}
            style={{
              alignSelf: "flex-end", padding: "10px 16px", borderRadius: 8,
              background: busy || !input.trim() ? "var(--proof-grey)" : "var(--proof-blue)",
              color: "white", border: "none", cursor: busy || !input.trim() ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500,
            }}
          >
            <Send size={14} /> Send
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
