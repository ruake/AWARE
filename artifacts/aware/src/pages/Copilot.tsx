import { useState, useEffect, useRef, useMemo } from "react";
import { useStore } from "@/lib/store";
import { computeFlakiness } from "@/lib/analytics";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User, Trash2, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface Message {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

const CHIPS = [
  "Analyze recent failures",
  "Compare environments",
  "Find flaky tests",
  "Explain anomalies",
  "Summarize pipeline health",
];

export default function Copilot() {
  // Targeted selectors — not entire store
  const runs        = useStore(state => state.runs);
  const testResults = useStore(state => state.testResults);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const endRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load persisted chat or set welcome message
  useEffect(() => {
    const saved = localStorage.getItem("aware_copilot_chat");
    if (saved) {
      try { setMessages(JSON.parse(saved)); } catch {}
    } else {
      setMessages([{
        role: "assistant",
        content: "I'm A.W.A.R.E. Copilot. I can analyze recent failures, find flaky tests, compare environments, or summarize pipeline health. What would you like to know?",
        ts: Date.now(),
      }]);
    }
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    localStorage.setItem("aware_copilot_chat", JSON.stringify(messages));
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Compute these from real store data for accurate responses
  const envStats = useMemo(() => {
    return ["QA", "UAT", "PROD"].map(env => {
      const envRuns = runs.filter(r => r.env === env);
      const avg = envRuns.length
        ? Math.round(envRuns.reduce((s, r) => s + r.passPct, 0) / envRuns.length)
        : 0;
      return { env, avg, count: envRuns.length };
    });
  }, [runs]);

  const generateMockAIResponse = async (query: string): Promise<string> => {
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 800));
    const q = query.toLowerCase();

    if (q.includes("flak")) {
      const flaky = computeFlakiness(runs, testResults).slice(0, 5);
      if (!flaky.length) return "No flaky tests detected in the current dataset. All tests have consistent pass/fail behaviour.";
      return `Top ${flaky.length} flaky tests detected:\n\n${flaky.map((f, i) =>
        `${i + 1}. **${f.testName}** (${f.category}) — ${(f.score * 100).toFixed(0)}% flakiness over ${f.runCount} runs`
      ).join("\n")}\n\nRecommendation: Review retry logic and environment isolation for these tests.`;
    }

    if (q.includes("fail") || q.includes("failure")) {
      const recent = runs.filter(r => r.status === "FAIL").slice(0, 5);
      if (!recent.length) return "No failures found in the current run history. All runs are passing.";
      return `Found ${recent.length} failed runs:\n\n${recent.map(r =>
        `- **${r.id}** (${r.env} ${r.network}) — ${r.passPct}% pass rate, ${r.failures} failure${r.failures !== 1 ? "s" : ""}`
      ).join("\n")}\n\nUse the Compare page to diff a failed run against the last passing run for root cause analysis.`;
    }

    if (q.includes("env") || q.includes("compare") || q.includes("environment")) {
      return `Average pass rates by environment:\n\n${envStats.map(e =>
        `- **${e.env}**: ${e.avg}% avg (${e.count} runs)`
      ).join("\n")}\n\n${
        envStats[0].avg < envStats[1].avg
          ? "QA shows lower pass rates than UAT — this is expected as QA runs on nightly builds."
          : "UAT and PROD are performing well. QA variance is normal."
      }`;
    }

    if (q.includes("anomal")) {
      const anomalies = runs.filter(r => r.passPct < 85 && r.status === "FAIL");
      if (!anomalies.length) return "No anomalies detected in the current window. Pass rates are within normal Z-score bounds.";
      return `${anomalies.length} anomalous run${anomalies.length > 1 ? "s" : ""} detected (pass rate < 85%):\n\n${anomalies.slice(0, 3).map(r =>
        `- **${r.id}** on ${r.env} ${r.network}: ${r.passPct}%`
      ).join("\n")}\n\nClick "Investigate Run" on the Dashboard to open a comparison against the baseline.`;
    }

    if (q.includes("health") || q.includes("summar") || q.includes("pipeline")) {
      const totalRuns = runs.length;
      const failRate  = runs.filter(r => r.status === "FAIL").length;
      const passRate  = runs.length ? Math.round(runs.reduce((s, r) => s + r.passPct, 0) / runs.length) : 0;
      return `Pipeline health summary:\n\n- **${totalRuns}** total runs across all environments\n- **${passRate}%** average pass rate\n- **${failRate}** failed runs (${Math.round((failRate / totalRuns) * 100)}% failure rate)\n\n${passRate >= 95 ? "Overall health is GOOD. The pipeline is stable." : "Overall health needs attention. Consider reviewing recent failures."}`;
    }

    return `Based on ${runs.length} runs across all environments, the pipeline currently shows a ${
      runs.length ? Math.round(runs.reduce((s, r) => s + r.passPct, 0) / runs.length) : "N/A"
    }% overall pass rate. Is there a specific environment, suite, or time window you want me to drill into?`;
  };

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg: Message = { role: "user", content: trimmed, ts: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      let aiText = "";
      if ("ai" in window) {
        try {
          const session = await (window as any).ai.createTextSession();
          aiText = await session.prompt(trimmed);
        } catch {
          aiText = await generateMockAIResponse(trimmed);
        }
      } else {
        aiText = await generateMockAIResponse(trimmed);
      }
      setMessages([...next, { role: "assistant", content: aiText, ts: Date.now() }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Sorry, I encountered an error. Please try again.", ts: Date.now() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  function clearHistory() {
    const welcome: Message = {
      role: "assistant",
      content: "Chat cleared. How can I help you?",
      ts: Date.now(),
    };
    setMessages([welcome]);
    localStorage.removeItem("aware_copilot_chat");
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="w-6 h-6 text-primary" /> AI Copilot
        </h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearHistory}
          className="text-muted-foreground hover:text-destructive gap-1.5"
        >
          <Trash2 className="w-4 h-4" /> Clear
        </Button>
      </div>

      <Card className="flex-1 flex flex-col bg-card overflow-hidden border-border shadow-sm min-h-0">
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-5 min-h-0">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold
                ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted border border-border"}`}>
                {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className="flex flex-col gap-1 max-w-[80%]">
                <div className={`px-4 py-3 rounded-xl text-sm whitespace-pre-wrap leading-relaxed
                  ${m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted/50 border border-border rounded-tl-sm"}`}>
                  {m.content}
                </div>
                <span className={`text-[10px] text-muted-foreground ${m.role === "user" ? "text-right" : ""}`}>
                  {format(new Date(m.ts), "HH:mm")}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground mr-1">Analyzing</span>
                {[0, 0.15, 0.3].map((delay, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}s` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </CardContent>

        <CardFooter className="flex-col gap-3 p-4 border-t bg-card">
          {/* Suggestion chips */}
          <div className="flex flex-wrap gap-2 w-full">
            <Sparkles className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            {CHIPS.map(chip => (
              <Badge
                key={chip}
                variant="outline"
                className={`cursor-pointer text-xs font-normal transition hover:bg-muted
                  ${loading ? "pointer-events-none opacity-40" : ""}`}
                onClick={() => !loading && handleSend(chip)}
              >
                {chip}
              </Badge>
            ))}
          </div>
          {/* Input */}
          <form
            className="flex gap-2 w-full relative"
            onSubmit={e => { e.preventDefault(); handleSend(input); }}
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask Copilot about failures, flakiness, or pipeline health…"
              className="pr-12 bg-background border-input"
              disabled={loading}
              onKeyDown={e => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || loading}
              className="absolute right-1 top-1 bottom-1 h-auto rounded-md"
              title="Send (Enter)"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
