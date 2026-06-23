import React from "react";
import { Copy } from "lucide-react";
import { useSimpleToast } from "@/hooks/useSimpleToast";

export function generateGitHubActionsYaml(suite: {
  id: string;
  name: string;
  schedule: string | null;
  envIds: string[];
  runners: string[];
  config: { parallelism: number };
}): string {
  const suiteName = suite.name.toLowerCase().replace(/\s+/g, "_");
  return `name: ${suite.name}
on:
  workflow_dispatch:
  schedule:
    - cron: '${suite.schedule || "0 0 * * 0"}'
jobs:
  ${suiteName}:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        env: [${suite.envIds.join(", ")}]
        runner: [${suite.runners.join(", ")}]
      max-parallel: ${suite.config.parallelism}
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install
      - run: pnpm --filter @workspace/aware-app run test -- --suite "${suite.id}"
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results-\${{ github.run_id }}
          path: artifacts/aware-app/test-results/
`;
}

export function YamlPreview({ yaml }: { yaml: string }) {
  const { show, Toast } = useSimpleToast();

  return (
    <div className="glass-panel" style={{ borderRadius: 12, overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "var(--proof-blue)",
              boxShadow: "var(--proof-glow-cyan)",
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: "var(--proof-text)",
            }}
          >
            GitHub Actions Workflow
          </span>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(yaml);
            show("YAML configuration copied to clipboard");
          }}
          className="proof-button-ghost proof-button-sm"
          style={{ padding: "4px 10px", color: "var(--proof-blue-bright)" }}
        >
          <Copy size={14} style={{ marginRight: 6 }}/> Copy YAML
        </button>
      </div>
      <pre
        style={{
          fontSize: 13,
          fontFamily: "var(--font-mono)",
          lineHeight: 1.6,
          overflow: "auto",
          maxHeight: 400,
          whiteSpace: "pre-wrap",
          padding: 20,
          margin: 0,
          background: "transparent",
        }}
      >
        {yaml.split("\n").map((line, i) => {
          const isComment = line.trim().startsWith("#");
          const isKey = line.includes(":") && !line.trim().startsWith("-");
          
          let coloredLine = <span style={{ color: "var(--proof-text)" }}>{line}</span>;
          
          if (isComment) {
             coloredLine = <span style={{ color: "var(--proof-text-muted)" }}>{line}</span>;
          } else if (isKey) {
             const parts = line.split(":");
             const key = parts[0];
             const val = parts.slice(1).join(":");
             coloredLine = (
               <>
                 <span style={{ color: "var(--proof-blue)" }}>{key}</span>:
                 <span style={{ color: val.trim().match(/^[0-9]+$/) ? "var(--proof-yellow)" : "var(--proof-green)" }}>{val}</span>
               </>
             );
          } else if (line.trim().startsWith("-")) {
             coloredLine = <span style={{ color: "var(--proof-text)" }}>{line}</span>;
          }

          return (
            <div key={i} style={{ display: "flex", gap: 16 }}>
              <span style={{ width: 24, textAlign: "right", opacity: 0.3, userSelect: "none", color: "var(--proof-text)" }}>{i + 1}</span>
              {coloredLine}
            </div>
          );
        })}
      </pre>
      {Toast}
    </div>
  );
}
