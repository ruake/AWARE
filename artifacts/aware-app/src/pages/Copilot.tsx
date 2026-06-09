import React from "react";
import { AppLayout } from "@/components/aware/AppLayout";
import { Bot, FileText, MessageSquare, Zap, Code2, BarChart3, GitCompare } from "lucide-react";

const SKILLS = [
  { id: "generate-tests", icon: Code2, name: "Generate Tests", description: "Create test cases from natural language descriptions", color: "var(--gcp-blue)" },
  { id: "generate-script", icon: FileText, name: "Generate Script", description: "Write YAML test scripts for automated testing", color: "var(--gcp-green)" },
  { id: "analyze-results", icon: BarChart3, name: "Analyze Results", description: "Review test failures and identify regressions", color: "var(--gcp-orange)" },
  { id: "explain-diff", icon: GitCompare, name: "Explain Diff", description: "Compare baseline vs candidate runs", color: "var(--gcp-purple)" },
  { id: "generate-suite", icon: Zap, name: "Generate Suite", description: "Create a test suite from requirements", color: "var(--gcp-yellow)" },
];

export default function Copilot() {
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<{ role: string; content: string }[]>([]);
  const [selectedSkill, setSelectedSkill] = React.useState(SKILLS[0]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: "user", content: input }]);
    setMessages(prev => [...prev, { role: "assistant", content: `Configure an OpenAI-compatible provider in Settings to use the ${selectedSkill.name} skill.` }]);
    setInput("");
  };

  const SkillIcon = selectedSkill.icon;

  return (
    <AppLayout activeHref="/copilot">
      <div style={{ display: "flex", gap: 16, height: "calc(100vh - 100px)" }}>
        {/* Sidebar */}
        <div className="gcp-card" style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--gcp-grey)", display: "flex", alignItems: "center", gap: 6 }}>
            <Bot size={16} style={{ color: "var(--gcp-blue)" }} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>Copilot</span>
          </div>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--gcp-grey)", fontSize: 11, fontWeight: 600, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Skills
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
            {SKILLS.map(skill => {
              const Icon = skill.icon;
              const isActive = skill.id === selectedSkill.id;
              return (
                <button key={skill.id} onClick={() => setSelectedSkill(skill)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", border: "none", cursor: "pointer", fontSize: 12, textAlign: "left", background: isActive ? skill.color + "18" : "transparent", color: "var(--gcp-text)", fontWeight: isActive ? 600 : 400 }}>
                  <Icon size={16} style={{ color: skill.color }} />
                  <span style={{ flex: 1 }}>{skill.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat area */}
        <div className="gcp-card" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--gcp-grey)", display: "flex", alignItems: "center", gap: 8, background: "var(--gcp-grey-bg)" }}>
            <SkillIcon size={16} style={{ color: selectedSkill.color }} />
            <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{selectedSkill.name}</span>
            <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>{selectedSkill.description}</span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "60px 20px", color: "var(--gcp-text-secondary)" }}>
                <Bot size={40} style={{ color: "var(--gcp-blue)", opacity: 0.3 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--gcp-text)" }}>Select a skill and describe what you need</p>
                <p style={{ fontSize: 12, textAlign: "center", maxWidth: 400, lineHeight: 1.6 }}>
                  {selectedSkill.description}. Requires an OpenAI-compatible API provider configured in Settings.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "10px 14px", borderRadius: 8, background: msg.role === "user" ? "var(--gcp-blue-bg)" : "var(--gcp-surface)", border: `1px solid ${msg.role === "user" ? "var(--gcp-blue)" : "var(--gcp-grey)"}`, fontSize: 12, lineHeight: 1.6 }}>
                <span style={{ fontWeight: 700, color: msg.role === "user" ? "var(--gcp-blue)" : "var(--gcp-text-secondary)", flexShrink: 0, textTransform: "capitalize" }}>{msg.role}:</span>
                <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--gcp-grey)", display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
              placeholder={`Describe what you want ${selectedSkill.name.toLowerCase()} to do...`}
              className="gcp-input"
              style={{ flex: 1, fontSize: 13 }}
            />
            <button onClick={handleSend} className="gcp-button-primary" style={{ fontSize: 13 }}>
              <MessageSquare size={14} /> Send
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
