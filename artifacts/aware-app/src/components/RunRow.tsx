import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { StatusBadge } from "@/components/StatusBadge";
import { envBadgeClass, passRateColor } from "@/lib/envStyles";
import { relativeTime } from "@/lib/utils";
import type { Run } from "@/lib/types";

export const RunRow = React.memo(function RunRow({ run }: { run: Run }) {
  const pc = passRateColor(run.passPct);
  return (
    <motion.tr
      className="group relative transition-colors hover:bg-gcp-elevated/40"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <td className="relative px-4 py-3">
        <span className="absolute left-0 top-2 bottom-2 w-0.5 origin-top scale-y-0 rounded-r-full bg-gcp-blue opacity-0 transition-all duration-200 group-hover:scale-y-100 group-hover:opacity-100" />
        <Link href={`/runs/${run.id}`} className="transition-colors group-hover:text-gcp-blue">
          <div className="font-mono text-xs font-medium text-gcp-text">{run.id}</div>
          <div className="mt-0.5 text-xs text-gcp-text-muted">{run.label}</div>
        </Link>
      </td>
      <td className="px-4 py-3">
        <motion.span
          className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-[10px] font-semibold transition-all duration-200 ${envBadgeClass(run.env)} group-hover:scale-105 group-hover:shadow-sm`}
        >
          {run.env}
        </motion.span>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-gcp-text-secondary">
        {run.suiteId.replace("suite_", "")}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-semibold tabular-nums ${pc.text}`}
            style={{ textShadow: "0 0 12px currentColor" }}
          >
            {run.passPct}%
          </span>
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gcp-elevated">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${run.passPct}%` }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
              className={`h-full rounded-full transition-all ${pc.bar}`}
              style={{ boxShadow: `0 0 6px ${pc.glow}` }}
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`font-mono text-xs tabular-nums ${run.failures > 0 ? "text-gcp-red" : "text-gcp-text-muted"}`}
        >
          {run.failures > 0 ? run.failures : "\u2014"}
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-gcp-text-secondary">{run.duration}</td>
      <td className="px-4 py-3 text-xs text-gcp-text-muted">{relativeTime(run.started)}</td>
      <td className="px-4 py-3">
        <StatusBadge status={run.status} />
      </td>
    </motion.tr>
  );
});
