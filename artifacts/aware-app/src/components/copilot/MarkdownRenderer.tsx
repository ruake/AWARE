import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLocation } from "wouter";
import { CodeHighlight } from "./CodeHighlight";

interface MarkdownRendererProps {
  content: string;
  streaming?: boolean;
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        background: "var(--proof-hover-light)",
        border: "1px solid var(--proof-border)",
        borderRadius: 4,
        padding: "1px 5px",
        fontSize: 12,
        fontFamily: "var(--font-mono)",
        color: "#a5f3fc",
      }}
    >
      {children}
    </code>
  );
}

function CodeBlock({ className, children }: { className?: string; children: React.ReactNode }) {
  const language = className?.replace("language-", "") ?? "";
  const code = String(children).replace(/\n$/, "");
  return <CodeHighlight code={code} language={language} />;
}

function CustomImage({ src, alt }: { src?: string; alt?: string }) {
  const [error, setError] = React.useState(false);
  if (error || !src) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "20px 16px",
          margin: "8px 0",
          background: "var(--proof-hover-light)",
          borderRadius: 8,
          border: "1px dashed var(--proof-border)",
          color: "var(--proof-text-muted)",
          fontSize: 12,
        }}
      >
        {alt ? `[Image: ${alt}]` : "Broken image"}
      </div>
    );
  }
  return (
    <div style={{ textAlign: "center", margin: "8px 0" }}>
      <a href={src} target="_blank" rel="noopener noreferrer">
        <img
          src={src}
          alt={alt ?? ""}
          loading="lazy"
          onError={() => setError(true)}
          style={{
            maxWidth: "100%",
            maxHeight: 300,
            borderRadius: 8,
            border: "1px solid var(--proof-border)",
            objectFit: "contain",
          }}
        />
      </a>
    </div>
  );
}

function CustomLink({ href, children }: { href?: string; children: React.ReactNode }) {
  const [, navigate] = useLocation();
  if (!href) return <>{children}</>;
  const isExternal = href.startsWith("http://") || href.startsWith("https://");
  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "var(--proof-blue-bright)",
          textDecoration: "underline",
          textDecorationColor: "rgba(59,130,246,0.4)",
        }}
      >
        {children}
      </a>
    );
  }
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        navigate(href);
      }}
      style={{
        color: "var(--proof-blue-bright)",
        textDecoration: "underline",
        textDecorationColor: "rgba(59,130,246,0.4)",
        cursor: "pointer",
      }}
    >
      {children}
    </a>
  );
}

function TaskList({ children }: { children: React.ReactNode }) {
  return (
    <ul style={{ listStyle: "none", paddingLeft: 0, margin: "0 0 10px" }}>
      {children}
    </ul>
  );
}

function TaskItem({ children, checked }: { children: React.ReactNode; checked: boolean }) {
  return (
    <li
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        margin: "4px 0",
        lineHeight: 1.6,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 16,
          height: 16,
          borderRadius: 3,
          border: `1.5px solid ${checked ? "#34d399" : "var(--proof-border)"}`,
          background: checked ? "rgba(52,211,153,0.15)" : "transparent",
          color: "#34d399",
          fontSize: 10,
          fontWeight: 700,
          flexShrink: 0,
          marginTop: 3,
        }}
      >
        {checked ? "✓" : ""}
      </span>
      <span style={{ flex: 1, textDecoration: checked ? "line-through" : "none", opacity: checked ? 0.6 : 1 }}>
        {children}
      </span>
    </li>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead style={{ background: "var(--proof-hover-light)" }}>
      {children}
    </thead>
  );
}

function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function MarkdownRenderer({ content, streaming }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p style={{ margin: "0 0 10px", lineHeight: 1.65 }}>{children}</p>
        ),
        ul: ({ node, children }) => {
          const cls = String((node?.properties as Record<string, unknown>)?.className ?? "");
          const isTaskList = cls.includes("contains-task-list");
          return isTaskList ? <TaskList>{children}</TaskList> : (
            <ul style={{ margin: "0 0 10px", paddingLeft: 18 }}>{children}</ul>
          );
        },
        ol: ({ children }) => (
          <ol style={{ margin: "0 0 10px", paddingLeft: 18 }}>{children}</ol>
        ),
        li: ({ children, ...props }) => {
          const checked = (props as Record<string, unknown>).checked as boolean | null | undefined;
          if (checked !== null && checked !== undefined) {
            return <TaskItem checked={checked}>{children}</TaskItem>;
          }
          return <li style={{ margin: "3px 0", lineHeight: 1.6 }}>{children}</li>;
        },
        code: ({ children, className }) => {
          const isBlock = !!className;
          return isBlock ? (
            <CodeBlock className={className}>{children}</CodeBlock>
          ) : (
            <InlineCode>{children}</InlineCode>
          );
        },
        pre: ({ children }) => <>{children}</>,
        h1: ({ children }) => (
          <h1
            style={{
              fontSize: 17,
              fontWeight: 700,
              margin: "14px 0 6px",
              letterSpacing: "-0.3px",
              borderLeft: "3px solid var(--proof-blue)",
              paddingLeft: 10,
            }}
          >
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              margin: "12px 0 5px",
              letterSpacing: "-0.2px",
              borderLeft: "3px solid var(--proof-blue)",
              paddingLeft: 10,
            }}
          >
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: "8px 0 4px" }}>
            {children}
          </h3>
        ),
        strong: ({ children }) => (
          <strong style={{ fontWeight: 700, color: "var(--proof-text)" }}>
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em style={{ color: "#94a3b8", fontStyle: "italic" }}>
            {children}
          </em>
        ),
        blockquote: ({ children }) => (
          <blockquote
            style={{
              borderLeft: "3px solid var(--proof-blue)",
              margin: "10px 0",
              color: "var(--proof-text-secondary)",
              fontSize: 13,
              background: "rgba(59,130,246,0.06)",
              borderRadius: "0 6px 6px 0",
              padding: "10px 14px",
            }}
          >
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div style={{ overflowX: "auto", margin: "10px 0" }}>
            <style>{`
              .copilot-table tr:nth-child(even) td {
                background: rgba(255,255,255,0.02);
              }
              .copilot-table tr:hover td {
                background: rgba(59,130,246,0.04);
              }
            `}</style>
            <table
              className="copilot-table"
              style={{
                borderCollapse: "collapse",
                fontSize: 12,
                width: "100%",
              }}
            >
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => <TableHead>{children}</TableHead>,
        tbody: ({ children }) => <TableBody>{children}</TableBody>,
        th: ({ children }) => (
          <th
            style={{
              padding: "8px 12px",
              borderBottom: "2px solid var(--proof-border)",
              textAlign: "left",
              fontWeight: 600,
              fontSize: 11,
              color: "var(--proof-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              whiteSpace: "nowrap",
              cursor: "default",
            }}
          >
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid var(--proof-border)",
              fontSize: 12,
            }}
          >
            {children}
          </td>
        ),
        a: ({ href, children }) => <CustomLink href={href}>{children}</CustomLink>,
        img: ({ src, alt }) => <CustomImage src={src} alt={alt} />,
        hr: () => (
          <hr
            style={{
              border: "none",
              height: 1,
              margin: "14px 0",
              background: "linear-gradient(to right, transparent, var(--proof-border), transparent)",
            }}
          />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default MarkdownRenderer;
export { InlineCode, CodeBlock, CustomImage, CustomLink, TaskList, TaskItem, TableHead, TableBody };
