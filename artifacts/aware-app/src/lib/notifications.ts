import { RUNS } from "./runs";

export interface Notification {
  id: string;
  runId: string;
  message: string;
  type: "info" | "success" | "warning";
  timestamp: number;
}

export function getNotifications(): Notification[] {
  const notifs: Notification[] = [];

  for (const run of RUNS) {
    const ts = new Date(run.started).getTime();
    const envLabel = run.env;

    if (run.status === "PASS") {
      notifs.push({
        id: `notif-${run.id}`,
        runId: run.id,
        message: `${run.label} — ${envLabel} — All tests passed (${run.passPct}%)`,
        type: "success" as const,
        timestamp: ts,
      });
    } else if (run.status === "FLAKY") {
      notifs.push({
        id: `notif-${run.id}`,
        runId: run.id,
        message: `${run.label} — ${envLabel} — ${run.failures} failure(s), ${run.passPct}% pass rate`,
        type: "warning" as const,
        timestamp: ts,
      });
    } else if (run.status === "FAIL") {
      notifs.push({
        id: `notif-${run.id}`,
        runId: run.id,
        message: `${run.label} — ${envLabel} — ${run.failures} failure(s)`,
        type: "warning" as const,
        timestamp: ts,
      });
    }
  }

  return notifs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
}
