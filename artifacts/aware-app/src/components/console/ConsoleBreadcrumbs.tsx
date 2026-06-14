import React from "react";
import { Link } from "wouter";

interface ConsoleBreadcrumbsProps {
  items: { label: string; href?: string }[];
}

export function ConsoleBreadcrumbs({ items }: ConsoleBreadcrumbsProps) {
  return (
    <nav
      style={{
        height: 32,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        background: "var(--proof-surface)",
        borderBottom: "1px solid var(--proof-border)",
        gap: 6,
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${i}`}>
            {i > 0 && (
              <span
                style={{
                  color: "var(--proof-text-muted)",
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  userSelect: "none",
                  flexShrink: 0,
                }}
              >
                /
              </span>
            )}
            {isLast || !item.href ? (
              <span
                style={{
                  fontSize: 12,
                  color: isLast ? "var(--proof-text)" : "var(--proof-text-secondary)",
                  fontWeight: isLast ? 600 : 400,
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                style={{
                  fontSize: 12,
                  color: "var(--proof-text-secondary)",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--proof-blue)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--proof-text-secondary)";
                }}
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
