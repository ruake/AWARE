import React from "react";
import { Link } from "wouter";
import {
  Play,
  GitCompare,
  BarChart3,
  Activity,
} from "lucide-react";

export function PulseFilterBar() {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid var(--proof-border)",
        background: "var(--proof-surface)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "var(--proof-text-muted)",
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          marginRight: 4,
        }}
      >
        Navigate
      </span>
      <div
        style={{
          width: 1,
          height: 14,
          background: "var(--proof-border-strong)",
          marginRight: 4,
        }}
      />
      {[
        { href: "/", icon: BarChart3, label: "Dashboard" },
        { href: "/runs", icon: Activity, label: "All Runs" },
        { href: "/compare", icon: GitCompare, label: "Compare" },
      ].map(({ href, icon: Ic, label }) => (
        <Link key={href} href={href}>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 11px",
              borderRadius: 6,
              border: "1px solid var(--proof-border-strong)",
              background: "var(--proof-surface-2)",
              color: "var(--proof-text-secondary)",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 500,
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--proof-text)";
              e.currentTarget.style.borderColor = "rgba(91,138,245,0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--proof-text-secondary)";
              e.currentTarget.style.borderColor = "var(--proof-border-strong)";
            }}
          >
            <Ic size={12} /> {label}
          </button>
        </Link>
      ))}
      <Link href="/start" style={{ marginLeft: "auto" }}>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 13px",
            borderRadius: 6,
            border: "none",
            background: "linear-gradient(135deg, #5b8af5 0%, #7c6af5 100%)",
            color: "white",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
            boxShadow: "0 1px 8px rgba(91,138,245,0.3)",
          }}
        >
          <Play size={12} /> Trigger New Run
        </button>
      </Link>
    </div>
  );
}
