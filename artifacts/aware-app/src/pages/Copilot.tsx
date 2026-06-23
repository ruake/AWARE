import React from "react";
import { CopilotSidebar } from "@/components/aware/CopilotSidebar";
import ChatMessage, { ChatMsg } from "@/components/aware/ChatMessage";
import { Send, Sparkles } from "lucide-react";

export default function Copilot() {
  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const [input, setInput] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    const query = text.trim();
    if (!query) return;
    
    setInput("");
    const newMsgId = crypto.randomUUID();
    setMessages(prev => [...prev, { role: "user", content: query, id: newMsgId }]);
    
    setIsTyping(true);
    
    // Mock response
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `I analyzed the runs based on your query: "${query}".\n\nThe PROD environment is currently showing a **99.8% pass rate**, but there are 3 flaky tests in the authentication suite that might require attention. Would you like me to generate a detailed report for those specific tests?`, 
        id: crypto.randomUUID() 
      }]);
    }, 1500);
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <CopilotSidebar onNewChat={handleNewChat} onSend={handleSend} />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: "var(--proof-bg)", position: "relative" }}>
        
        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 40px", scrollBehavior: "smooth" }}>
          {messages.length === 0 ? (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--proof-text-secondary)" }}>
              <Sparkles size={48} style={{ color: "var(--proof-blue)", opacity: 0.5, marginBottom: 24 }} />
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--proof-text)", marginBottom: 8, letterSpacing: "-0.5px" }}>A.W.A.R.E. Copilot</h2>
              <p style={{ fontSize: 14, maxWidth: 400, textAlign: "center", marginBottom: 32 }}>Your AI assistant for analyzing test runs, detecting anomalies, and diagnosing infrastructure issues.</p>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", maxWidth: 600 }}>
                {["Summarize the latest PROD run", "Which tests are currently flaky?", "Show me performance trends for the checkout API", "Are there any active anomalies?"].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(suggestion)}
                    className="glass-panel"
                    style={{
                      padding: "10px 16px",
                      borderRadius: "var(--proof-radius-full)",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--proof-border)",
                      color: "var(--proof-text)",
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "rgba(0,196,255,0.1)";
                      e.currentTarget.style.borderColor = "var(--proof-blue)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                      e.currentTarget.style.borderColor = "var(--proof-border)";
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              {messages.map((msg, idx) => (
                <ChatMessage key={msg.id} msg={msg} index={idx} />
              ))}
              {isTyping && (
                <div style={{ display: "flex", gap: 16, padding: "24px 0", animation: "fade-in 0.3s ease-out" }}>
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
                placeholder="Ask Copilot anything..."
                className="glass-panel"
                style={{
                  width: "100%",
                  padding: "16px 56px 16px 20px",
                  borderRadius: "var(--proof-radius-xl)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontSize: 15,
                  color: "white",
                  outline: "none",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.4)"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--proof-blue)";
                  e.target.style.boxShadow = "var(--proof-glow-cyan)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.1)";
                  e.target.style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)";
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: input.trim() && !isTyping ? "var(--proof-blue)" : "var(--proof-surface-3)",
                  border: "none",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: input.trim() && !isTyping ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                  boxShadow: input.trim() && !isTyping ? "0 0 12px var(--proof-blue)" : "none"
                }}
              >
                <Send size={16} style={{ marginLeft: input.trim() && !isTyping ? 2 : 0 }} />
              </button>
            </form>
            <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "var(--proof-text-muted)", fontFamily: "var(--font-mono)" }}>
              AI can make mistakes. Verify critical information.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
