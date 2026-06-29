import { useState } from "react";
import { Lightbulb, ChevronDown, ChevronUp } from "lucide-react";

interface ReasoningBlockProps {
  reasoning: string | null | undefined;
  recommendations: string | null | undefined;
}

export default function ReasoningBlock({ reasoning, recommendations }: ReasoningBlockProps) {
  const [open, setOpen] = useState(false);
  if (!reasoning && !recommendations) return null;

  return (
    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 mt-2 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition"
      >
        <Lightbulb className="w-3.5 h-3.5" />
        <span className="font-medium">AI Reasoning & Recommendations</span>
        {open ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
      </button>
      {open && (
        <div className="px-3 pb-3 text-xs leading-relaxed space-y-2 text-muted-foreground">
          {reasoning && (
            <div>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Reasoning: </span>
              {reasoning}
            </div>
          )}
          {recommendations && (
            <div className="whitespace-pre-wrap">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Recommendations: </span>
              {recommendations}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
