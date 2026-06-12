import React from "react";
import { Copy } from "lucide-react";
import { useSimpleToast } from "@/hooks/useSimpleToast";

export function generateGitHubActionsYaml(suite: {
  id: string;
  name: string;
  schedule: string | null;
  config: { target: string; environment: string; parallelism: number };
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
        target: [${suite.config.target}]
        environment: [${suite.config.environment}]
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
        borderBottom: "1px solid var(--proof-grey)",
        background: "#1e1e1e",
        color: "#c9d1d9",
        padding: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "#8b949e",
          }}
        >
          GitHub Actions Workflow
        </span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(yaml);
            show("YAML copied");
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
            color: "var(--proof-blue)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Copy size={12} /> Copy
        </button>
      </div>
      <pre
        style={{
          fontSize: 11,
          fontFamily: "var(--font-mono)",
          lineHeight: 1.6,
          overflow: "auto",
          maxHeight: 200,
          whiteSpace: "pre-wrap",
        }}
      >
        {yaml}
      </pre>
      {Toast}
    </div>
  );
}
