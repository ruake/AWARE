import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { computeFlakiness } from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User, Trash2, Badge } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Copilot() {
  const store = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("aware_copilot_chat");
    if (saved) {
      try { setMessages(JSON.parse(saved)); } catch (e) {}
    } else {
      setMessages([{ role: "assistant", content: "I'm A.W.A.R.E. Copilot. I can analyze recent failures, find flaky tests, or summarize pipeline health. What would you like to know?" }]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("aware_copilot_chat", JSON.stringify(messages));
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateMockAIResponse = async (query: string) => {
    // Simulate AI thinking
    await new Promise(r => setTimeout(r, 1500));
    
    const q = query.toLowerCase();
    let response = "";

    if (q.includes("flaky")) {
      const flaky = computeFlakiness(store.runs, store.testResults).slice(0, 5);
      response = `Here are the top ${flaky.length} flaky tests I found based on transition analysis:\n\n`;
      flaky.forEach((f, i) => {
        response += `${i + 1}. **${f.testName}** (${f.category}) - ${(f.score * 100).toFixed(0)}% flakiness over ${f.runCount} runs.\n`;
      });
    } else if (q.includes("fail")) {
      const recentFails = store.runs.filter(r => r.status === "FAIL").slice(0, 3);
      response = `I found ${recentFails.length} recent failures.\n\n`;
      recentFails.forEach(r => {
        response += `- Run **${r.id}** (${r.env} ${r.network}) failed with a pass rate of ${r.passPct}%.\n`;
      });
    } else if (q.includes("env") || q.includes("compare")) {
      response = "Average pass rates by environment:\n\n- **QA**: ~92%\n- **UAT**: ~96%\n- **PROD**: ~99%\n\nQA staging seems to have the highest variance in the last 7 days.";
    } else {
      response = `Based on the last 30 days of telemetry, the pipeline is generally healthy. Overall pass rate is stable above 95%, though there were anomalies in QA staging yesterday. Is there a specific suite you want me to drill into?`;
    }

    return response;
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      let aiText = "";
      if ('ai' in window) {
        // Attempt Chrome window.ai
        try {
          const session = await (window as any).ai.createTextSession();
          aiText = await session.prompt(text);
        } catch (e) {
          aiText = await generateMockAIResponse(text);
        }
      } else {
        aiText = await generateMockAIResponse(text);
      }
      setMessages([...newMessages, { role: "assistant", content: aiText }]);
    } catch (e) {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I encountered an error connecting to the analysis engine." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Bot className="w-6 h-6 text-primary" /> AI Copilot</h1>
        <Button variant="ghost" size="sm" onClick={() => setMessages([{ role: "assistant", content: "How can I help you today?" }])} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="w-4 h-4 mr-2" /> Clear History
        </Button>
      </div>

      <Card className="flex-1 flex flex-col bg-card overflow-hidden border-border shadow-sm">
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`px-4 py-3 rounded-lg max-w-[80%] text-sm whitespace-pre-wrap leading-relaxed ${
                m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 border border-border'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><Bot className="w-4 h-4" /></div>
              <div className="px-4 py-3 rounded-lg bg-muted/50 border border-border text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"/>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}/>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.4s'}}/>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </CardContent>

        <div className="p-4 border-t bg-card">
          <div className="flex flex-wrap gap-2 mb-4">
            {["Analyze recent failures", "Compare environments", "Find flaky tests", "Explain anomalies"].map(chip => (
              <Badge 
                key={chip} 
                variant="secondary" 
                className="cursor-pointer hover:bg-secondary/80 font-normal"
                onClick={() => handleSend(chip)}
              >
                {chip}
              </Badge>
            ))}
          </div>
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="flex gap-2 relative"
          >
            <Input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder="Ask Copilot..." 
              className="pr-12 bg-background border-input"
              disabled={loading}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || loading} className="absolute right-1 top-1 bottom-1 h-auto rounded">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
