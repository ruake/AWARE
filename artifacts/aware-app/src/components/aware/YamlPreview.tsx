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
    <div
      style={{
        border: "1px solid var(--proof-border)",
        borderRadius: 12,
        background: "var(--proof-surface)",
        color: "var(--proof-text)",
        overflow: "hidden",
        boxShadow: "var(--proof-shadow-sm)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          background: "var(--proof-surface-2)",
          borderBottom: "1px solid var(--proof-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--proof-blue)",
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--proof-text-secondary)",
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
          className="proof-button proof-button-sm"
          style={{ padding: "4px 10px" }}
        >
          <Copy size={12} /> Copy YAML
        </button>
      </div>
      <pre
        style={{
          fontSize: 12,
          fontFamily: "var(--font-mono)",
          lineHeight: 1.6,
          overflow: "auto",
          maxHeight: 400,
          whiteSpace: "pre-wrap",
          padding: 20,
          margin: 0,
          background: "var(--proof-surface)",
          color: "var(--proof-text)",
        }}
      >
        {yaml.split("\n").map((line, i) => {
          const isComment = line.trim().startsWith("#");
          const isKey = line.includes(":") && !line.startsWith("-");
          
          return (
            <div key={i} style={{ display: "flex", gap: 16 }}>
              <span style={{ width: 24, textAlign: "right", opacity: 0.3, userSelect: "none" }}>{i + 1}</span>
              <span style={{ 
                color: isComment 
                  ? "var(--proof-text-secondary)" 
                  : isKey 
                    ? "var(--proof-blue)" 
                    : "var(--proof-text)" 
              }}>
                {line}
              </span>
            </div>
          );
        })}
      </pre>
      {Toast}
    </div>
  );
}
