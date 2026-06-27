import { useStore } from "@/lib/store";
import { CheckCircle2, XCircle } from "lucide-react";

export function PropertyStatusBar() {
  const runs = useStore(state => state.runs);
  
  // Compute UAT gate status
  const uatRuns = runs.filter(r => r.env === "UAT");
  const gateThresholdStr = localStorage.getItem("aware-settings-v1") || '{"gateThreshold": 95}';
  let threshold = 95;
  try { threshold = JSON.parse(gateThresholdStr).gateThreshold || 95; } catch (e) {}

  const isPassing = uatRuns.length === 0 || (uatRuns.reduce((sum, r) => sum + r.passPct, 0) / uatRuns.length >= threshold);

  return (
    <div className={`h-8 border-t flex items-center px-4 text-xs font-medium justify-between z-20 shrink-0
      ${isPassing ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
      <div className="flex items-center gap-2">
        {isPassing ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
        <span>PROMOTION GATE: {isPassing ? 'OPEN' : 'BLOCKED'}</span>
      </div>
      <div>
        UAT Pass Rate: {uatRuns.length > 0 ? (uatRuns.reduce((sum, r) => sum + r.passPct, 0) / uatRuns.length).toFixed(1) : 0}% (Threshold: {threshold}%)
      </div>
    </div>
  );
}
