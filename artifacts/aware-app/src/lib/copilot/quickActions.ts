import {
  Activity, RefreshCw, GitCompare, Shield, AlertTriangle, Layers, Timer, Globe,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  badge: string;
  message: string;
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "latest-runs",
    label: "Latest Runs",
    icon: Activity,
    color: "#3b82f6",
    badge: "query_runs",
    message: "Show me the last 15 test runs with pass rates, failure counts, and environments as a table.",
  },
  {
    id: "flaky-tests",
    label: "Flaky Tests",
    icon: RefreshCw,
    color: "#f59e0b",
    badge: "get_flaky_tests",
    message: "Which tests are flaky? Rank them by flakiness score and show the PASS/FAIL flip sequence.",
  },
  {
    id: "env-compare",
    label: "Env Compare",
    icon: GitCompare,
    color: "#8b5cf6",
    badge: "compare_environments",
    message: "Compare QA, UAT, and PROD environments — show avg pass rates, total failures, and health status.",
  },
  {
    id: "promotion-gate",
    label: "Promo Gate",
    icon: Shield,
    color: "#10b981",
    badge: "get_promotion_status",
    message: "Show UAT→PROD promotion gate status — how many decisions promoted, blocked, or pending?",
  },
  {
    id: "failure-breakdown",
    label: "Failure Root Cause",
    icon: AlertTriangle,
    color: "#ef4444",
    badge: "get_failure_breakdown",
    message: "Break down failures in the latest run by category (WAF, TLS, API, EdgeWorker). Show which area has the most failures.",
  },
  {
    id: "suite-health",
    label: "Suite Health",
    icon: Layers,
    color: "#06b6d4",
    badge: "get_suite_health",
    message: "Show pass rates and failure counts for all test suites. Which suite is struggling?",
  },
  {
    id: "duration-trends",
    label: "Duration Trends",
    icon: Timer,
    color: "#ec4899",
    badge: "get_duration_trends",
    message: "Show execution duration trends across the last 10 runs. Are there any timing regressions?",
  },
  {
    id: "akamai-property",
    label: "Akamai Status",
    icon: Globe,
    color: "#f97316",
    badge: "get_akamai_property",
    message: "Show Akamai property versions, EdgeWorker versions, PoP counts, and activation status for all environments.",
  },
];
