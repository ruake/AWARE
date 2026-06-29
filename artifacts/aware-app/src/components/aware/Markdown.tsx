import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MarkdownCode } from "./MarkdownCode";
import { Link } from "wouter";

export function Markdown({ content, mono = false }: { content: string, mono?: boolean }) {
  return (
    <div style={{ fontFamily: mono ? "var(--font-mono)" : "inherit" }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: MarkdownCode,
          a: ({ href, children }) => {
            if (href?.startsWith("/")) {
              return <Link href={href} style={{ color: "var(--proof-blue)", textDecoration: "none", fontWeight: 600 }}>{children}</Link>;
            }
            return <a href={href} target="_blank" rel="noreferrer" style={{ color: "var(--proof-blue)", textDecoration: "none", fontWeight: 600 }}>{children}</a>;
          },
          h1: ({ children }) => <h1 style={{ fontSize: 18, fontWeight: 700, margin: "16px 0 8px", color: "var(--proof-text)" }}>{children}</h1>,
          h2: ({ children }) => <h2 style={{ fontSize: 16, fontWeight: 700, margin: "14px 0 8px", color: "var(--proof-text)" }}>{children}</h2>,
          h3: ({ children }) => <h3 style={{ fontSize: 14, fontWeight: 700, margin: "12px 0 6px", color: "var(--proof-blue)" }}>{children}</h3>,
          p: ({ children }) => <p style={{ margin: "0 0 12px 0", lineHeight: 1.6 }}>{children}</p>,
          ul: ({ children }) => <ul style={{ margin: "0 0 12px 0", paddingLeft: 20 }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ margin: "0 0 12px 0", paddingLeft: 20 }}>{children}</ol>,
          li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
          table: ({ children }) => (
            <div style={{ overflowX: "auto", margin: "16px 0", borderRadius: 8, border: "1px solid var(--proof-border)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => <th style={{ background: "var(--proof-surface-2)", padding: "8px 12px", textAlign: "left", borderBottom: "1px solid var(--proof-border)" }}>{children}</th>,
          td: ({ children }) => <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--proof-border-light)" }}>{children}</td>,
          blockquote: ({ children }) => (
            <blockquote style={{ borderLeft: "3px solid var(--proof-blue)", margin: "12px 0", padding: "8px 16px", background: "var(--proof-blue-bg)", color: "var(--proof-text-secondary)", borderRadius: "0 8px 8px 0" }}>
              {children}
            </blockquote>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
