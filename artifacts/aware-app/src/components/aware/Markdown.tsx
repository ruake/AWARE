import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Chart } from "react-google-charts";

interface MarkdownProps {
  content: string;
  mono?: boolean;
}

const LINK_PATTERNS = [
  { pattern: /\b(run_\w+)\b/g, href: (id: string) => `/runs/${encodeURIComponent(id)}` },
  { pattern: /\b(tr_\w+)\b/g, href: (id: string) => `/runs/${encodeURIComponent(id)}` },
  {
    pattern: /\b(diff_\w+)\b/g,
    href: (id: string) => `/analytics?diffId=${encodeURIComponent(id)}`,
  },
  // Test IDs: any lowercase-prefix + underscore + digits (ad_14, pu_3, ht_20, pw_14, etc.)
  {
    pattern: /\b([a-z]+_\d+)\b/g,
    href: (id: string) => `/analytics?testId=${encodeURIComponent(id)}`,
  },
];

function linkifyContent(text: string): string {
  const segments: { type: "skip" | "text"; content: string; codeContent?: string }[] = [];
  let lastIndex = 0;
  const skipRe = /```[\s\S]*?```|(`([^`]*)`)|(\[[^\]]*\]\([^)]*\))/g;
  let match: RegExpExecArray | null;

  while ((match = skipRe.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    if (match[0].startsWith("```")) {
      segments.push({ type: "skip", content: match[0] });
    } else {
      const backtickContent = match[3];
      if (backtickContent) {
        segments.push({ type: "skip", content: match[0], codeContent: backtickContent });
      } else {
        segments.push({ type: "skip", content: match[0] });
      }
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  function linkifyStr(str: string): string {
    let result = str;
    for (const { pattern, href } of LINK_PATTERNS) {
      result = result.replace(pattern, (id: string) => `[${id}](${href(id)})`);
    }
    return result;
  }

  return segments
    .map((seg) => {
      if (seg.type === "skip" && seg.codeContent) {
        const linked = linkifyStr(seg.codeContent);
        if (linked !== seg.codeContent) return linked;
      }
      if (seg.type === "skip") return seg.content;
      return linkifyStr(seg.content);
    })
    .join("");
}

const components = {
  table: ({ children }: { children: React.ReactNode }) => (
    <div style={{ overflowX: "auto", margin: "8px 0" }}>
      <table className="proof-table" style={{ fontSize: 11 }}>
        {children}
      </table>
    </div>
  ),
  th: ({ children }: { children: React.ReactNode }) => (
    <th style={{ padding: "4px 10px", textAlign: "left", whiteSpace: "nowrap" }}>{children}</th>
  ),
  td: ({ children }: { children: React.ReactNode }) => (
    <td style={{ padding: "4px 10px", fontSize: 11 }}>{children}</td>
  ),
  code: ({ className, children, ...props }: { className?: string; children?: React.ReactNode }) => {
    const lang = className?.replace(/^language-/, "");
    if (lang === "chart") {
      try {
        const config = JSON.parse(String(children).trim());
        const rows = config.rows || [];
        if (rows.length === 0) {
          return (
            <div
              style={{
                padding: 12,
                fontSize: 11,
                color: "var(--proof-text-secondary)",
                textAlign: "center",
              }}
            >
              No data
            </div>
          );
        }
        const chartType = config.type || "ColumnChart";
        const data = [config.headers || ["X", "Y"], ...rows];
        return (
          <Chart
            chartType={chartType}
            data={data}
            options={{
              title: config.title || "",
              titleTextStyle: { fontSize: 12, color: "#9aa0a6" },
              legend: { position: "bottom", textStyle: { fontSize: 10 } },
              colors: config.colors || ["#5b8af5", "#f59e0b", "#22c55e", "#ef4444", "#a855f7"],
              backgroundColor: "transparent",
              chartArea: { width: "90%", height: "70%" },
              hAxis: { textStyle: { fontSize: 10 } },
              vAxis: { textStyle: { fontSize: 10 } },
              pointSize: config.pointSize || 0,
              curveType: config.curveType || "none",
              isStacked: config.isStacked || false,
              pieHole: config.pieHole || 0,
              ...(config.options || {}),
            }}
            width="100%"
            height={config.height || "200px"}
            chartLanguage="en"
            chartPackages={["corechart", "controls"]}
          />
        );
      } catch {
        // fall through to normal code rendering
      }
    }
    const isInline = !className;
    if (isInline) {
      return (
        <code
          style={{
            background: "var(--proof-grey-bg)",
            padding: "1px 5px",
            borderRadius: 3,
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            color: "var(--proof-blue)",
          }}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <pre
        style={{
          background: "var(--proof-grey-bg)",
          padding: 12,
          borderRadius: 6,
          overflowX: "auto",
          fontSize: 11,
          fontFamily: "var(--font-mono)",
          lineHeight: 1.5,
          border: "1px solid var(--proof-grey)",
          margin: "8px 0",
        }}
      >
        <code {...props}>{children}</code>
      </pre>
    );
  },
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: "var(--proof-blue)",
        textDecoration: "underline",
        fontWeight: 500,
      }}
    >
      {children}
    </a>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul style={{ margin: "6px 0 8px", paddingLeft: 18, fontSize: 13, lineHeight: 1.75 }}>{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol style={{ margin: "6px 0 8px", paddingLeft: 18, fontSize: 13, lineHeight: 1.75 }}>{children}</ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li style={{ marginBottom: 4, paddingLeft: 2 }}>{children}</li>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p style={{ margin: "0 0 10px", lineHeight: 1.7, fontSize: 13 }}>{children}</p>
  ),
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong style={{ fontWeight: 700, color: "var(--proof-text)" }}>{children}</strong>
  ),
  em: ({ children }: { children: React.ReactNode }) => (
    <em style={{ color: "var(--proof-text-secondary)", fontStyle: "italic" }}>{children}</em>
  ),
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 style={{
      fontSize: 16, fontWeight: 700, margin: "16px 0 8px",
      paddingBottom: 6, borderBottom: "2px solid var(--proof-blue)",
      color: "var(--proof-text)",
    }}>{children}</h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 style={{
      fontSize: 14, fontWeight: 700, margin: "14px 0 6px",
      paddingBottom: 4, borderBottom: "1px solid var(--proof-border)",
      color: "var(--proof-text)",
    }}>{children}</h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 style={{
      fontSize: 13, fontWeight: 600, margin: "12px 0 4px",
      color: "var(--proof-blue)",
    }}>{children}</h3>
  ),
  h4: ({ children }: { children: React.ReactNode }) => (
    <h4 style={{
      fontSize: 12, fontWeight: 600, margin: "10px 0 3px",
      textTransform: "uppercase", letterSpacing: "0.06em",
      color: "var(--proof-text-muted)",
    }}>{children}</h4>
  ),
  hr: () => (
    <hr style={{ border: "none", borderTop: "1px solid var(--proof-border)", margin: "14px 0" }} />
  ),
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote
      style={{
        borderLeft: "3px solid var(--proof-blue)",
        paddingLeft: 14,
        margin: "10px 0",
        color: "var(--proof-text-secondary)",
        background: "var(--proof-grey-bg)",
        borderRadius: "0 6px 6px 0",
        padding: "8px 14px",
      }}
    >
      {children}
    </blockquote>
  ),
};

export function Markdown({ content, mono = false }: MarkdownProps) {
  const linked = React.useMemo(() => linkifyContent(content), [content]);
  return (
    <div style={{ fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)" }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {linked}
      </ReactMarkdown>
    </div>
  );
}
