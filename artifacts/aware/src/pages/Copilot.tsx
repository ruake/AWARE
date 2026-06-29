import { useState, useEffect, useRef, useMemo } from "react";
import { useStore } from "@/lib/store";
import { AgentGraph } from "@/lib/agentgraph";
import { OrchestratorNode } from "@/lib/agentgraph/orchestrator";
import { DataAgentNode } from "@/lib/agentgraph/data-agent";
import { ChartAgentNode } from "@/lib/agentgraph/chart-agent";
import { ChartConfig } from "@/lib/agentgraph/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bot, Send, User, Trash2, Sparkles, Cpu, Zap, BrainCircuit,
} from "lucide-react";
import { format } from "date-fns";
import ChartMessage from "@/components/copilot/ChartMessage";
import ReasoningBlock from "@/components/copilot/ReasoningBlock";
import {
  getChromeAiCapabilities,
  generateResponseStream,
  isChromeAiAvailable,
} from "@/lib/agentgraph/chrome-ai";

interface Message {
  role: "user" | "assistant";
  content: string;
  ts: number;
  chartConfig?: ChartConfig | null;
  chromeAi?: boolean;
  reasoning?: string | null;
  recommendations?: string | null;
  streaming?: boolean;
}

const CHIPS = [
  "Analyze recent failures",
  "Compare environments",
  "Find flaky tests",
  "Explain anomalies",
  "Summarize pipeline health",
  "Show pass rate trend",
];

const graph = new AgentGraph()
  .addNode(OrchestratorNode)
  .addNode(DataAgentNode)
  .addNode(ChartAgentNode)
  .addEdge("orchestrator", "data-agent")
  .addEdge("data-agent", "chart-agent");

export default function Copilot() {
  const runs        = useStore(state => state.runs);
  const testResults = useStore(state => state.testResults);
  const testCases   = useStore(state => state.testCases);
  const suites      = useStore(state => state.suites);
  const schedulerStatus = useStore(state => state.schedulerStatus);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [chromeAi, setChromeAi] = useState<{ avail: boolean; ready: "readily" | "after-download" | "no" | "checking" }>({ avail: false, ready: "checking" });
  const endRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ─── Chrome AI availability probe ─── */
  useEffect(() => {
    const probe = async () => {
      const c = await getChromeAiCapabilities();
      if (c) {
        setChromeAi({ avail: c.available !== "no", ready: c.available });
      } else {
        setChromeAi({ avail: false, ready: "no" });
      }
    };
    probe();
  }, []);

  /* ─── Load saved chat ─── */
  useEffect(() => {
    const saved = localStorage.getItem("aware_copilot_chat");
    if (saved) {
      try { setMessages(JSON.parse(saved)); } catch {}
    } else {
      setMessages([{
        role: "assistant",
        content: chromeAi.avail
          ? "I'm A.W.A.R.E. Copilot, powered by **Chrome built-in AI (Gemini Nano)**. I analyze failures, find flaky tests, compare environments, and reason about root causes in real time. What would you like to explore?"
          : "I'm A.W.A.R.E. Copilot, powered by **AgentGraph orchestration**. Chrome AI is unavailable — responses use rule-based analytics. Ask about failures, flakiness, trends, or environment comparisons.",
        ts: Date.now(),
      }]);
    }
    inputRef.current?.focus();
  }, [chromeAi.avail]);

  /* ─── Persist chat & scroll ─── */
  useEffect(() => {
    localStorage.setItem("aware_copilot_chat", JSON.stringify(messages));
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const envStats = useMemo(() => {
    return ["QA", "UAT", "PROD"].map(env => {
      const envRuns = runs.filter(r => r.env === env);
      const avg = envRuns.length
        ? Math.round(envRuns.reduce((s, r) => s + r.passPct, 0) / envRuns.length)
        : 0;
      return { env, avg, count: envRuns.length };
    });
  }, [runs]);

  /* ─── Main send handler ─── */
  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      /* 1. Run the AgentGraph for data analysis + chart config */
      const ctx = await graph.execute("orchestrator", {
        query: trimmed,
        runs,
        testResults,
        testCases,
        suites,
        schedulerStatus,
      });

      let responseText = ctx.textResponse;
      if (ctx.error) {
        responseText = `Sorry, I encountered an error: ${ctx.error}`;
      }

      const usedChromeAi = ctx.intent !== "unknown" && await isChromeAiAvailable();

      /* 2. If Chrome AI is available, try streaming for richer text */
      if (usedChromeAi) {
        const assistantId = Date.now();
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "",
          ts: assistantId,
          chartConfig: ctx.chartConfig,
          chromeAi: true,
          reasoning: ctx.reasoning,
          recommendations: ctx.recommendations,
          streaming: true,
        }]);

        const stream = generateResponseStream(ctx);
        let full = "";
        for await (const chunk of stream) {
          full = chunk;
          setMessages(prev => {
            const idx = prev.findIndex(m => m.ts === assistantId && m.role === "assistant");
            if (idx === -1) return prev;
            const next = [...prev];
            next[idx] = {
              ...next[idx],
              content: chunk,
              streaming: true,
            };
            return next;
          });
        }

        setMessages(prev => {
          const idx = prev.findIndex(m => m.ts === assistantId && m.role === "assistant");
          if (idx === -1) return prev;
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            content: full || responseText,
            streaming: false,
          };
          return next;
        });
      } else {
        /* 3. Fallback: static rule-based response */
        const assistantMsg: Message = {
          role: "assistant",
          content: responseText,
          ts: Date.now(),
          chartConfig: ctx.chartConfig,
          chromeAi: false,
          reasoning: ctx.reasoning,
          recommendations: ctx.recommendations,
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error during analysis. Please try again.",
        ts: Date.now(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  function clearHistory() {
    const welcome: Message = {
      role: "assistant",
      content: chromeAi.avail
        ? "Chat cleared. Ask me about failures, flakiness, environment comparisons, or pipeline health — I'll use Chrome AI to reason through the data."
        : "Chat cleared. How can I help you?",
      ts: Date.now(),
    };
    setMessages([welcome]);
    localStorage.removeItem("aware_copilot_chat");
  }

  const aiBadgeText = chromeAi.ready === "checking"
    ? "Checking..."
    : chromeAi.ready === "readily"
      ? "Chrome AI • Ready"
      : chromeAi.ready === "after-download"
        ? "Chrome AI • Downloading"
        : chromeAi.avail
          ? "Chrome AI"
          : "Rule Engine";

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" /> AI Copilot
          </h1>
          <Badge
            variant="outline"
            className={`gap-1.5 text-xs font-normal ${
              chromeAi.ready === "readily"
                ? "border-emerald-500/50 text-emerald-500"
                : chromeAi.ready === "after-download"
                  ? "border-amber-500/50 text-amber-500"
                  : "border-muted-foreground/30 text-muted-foreground"
            }`}
          >
            <Cpu className="w-3 h-3" />
            {aiBadgeText}
          </Badge>
        </div>
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
              <div className="flex flex-col gap-1 max-w-[85%]">
                <div className={`px-4 py-3 rounded-xl text-sm whitespace-pre-wrap leading-relaxed
                  ${m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted/50 border border-border rounded-tl-sm"}`}>
                  {m.content || (m.streaming ? <span className="animate-pulse text-muted-foreground">Thinking…</span> : "")}
                </div>

                {m.role === "assistant" && m.chartConfig && !m.streaming && (
                  <div className="w-full">
                    <ChartMessage config={m.chartConfig} />
                  </div>
                )}

                {m.role === "assistant" && (m.reasoning || m.recommendations) && !m.streaming && (
                  <ReasoningBlock reasoning={m.reasoning} recommendations={m.recommendations} />
                )}

                <div className={`flex items-center gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(m.ts), "HH:mm")}
                  </span>
                  {m.role === "assistant" && m.chromeAi && (
                    <Badge variant="outline" className="text-[9px] h-4 px-1 border-emerald-500/30 text-emerald-500/70 gap-0.5">
                      <Zap className="w-2.5 h-2.5" /> Chrome AI
                    </Badge>
                  )}
                  {m.role === "assistant" && m.chromeAi === false && (
                    <Badge variant="outline" className="text-[9px] h-4 px-1 border-muted-foreground/20 text-muted-foreground/60 gap-0.5">
                      <BrainCircuit className="w-2.5 h-2.5" /> Rule Engine
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
          {loading && !messages.some(m => m.streaming) && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground mr-1">Orchestrating</span>
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
          <form
            className="flex gap-2 w-full relative"
            onSubmit={e => { e.preventDefault(); handleSend(input); }}
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={chromeAi.avail
                ? "Ask Copilot anything — Chrome AI reasons through the data…"
                : "Ask Copilot about failures, flakiness, or pipeline health…"
              }
              className="pr-20 bg-background border-input"
              disabled={loading}
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
