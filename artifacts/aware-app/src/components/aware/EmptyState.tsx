import React from "react";

interface EmptyStateProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 32px",
        textAlign: "center",
        width: "100%",
        minHeight: 320,
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: "var(--proof-surface-3)",
          border: "1px solid var(--proof-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          color: "var(--proof-text-muted)",
        }}
      >
        <Icon size={32} />
      </div>
      <h3
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "var(--proof-text)",
          margin: "0 0 8px",
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: 14,
          color: "var(--proof-text-secondary)",
          margin: "0 0 24px",
          maxWidth: 400,
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        {action && (
          <button
            onClick={action.onClick}
            className="proof-btn proof-btn-primary"
            style={{
              padding: "10px 24px",
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 8,
            }}
          >
            {action.label}
          </button>
        )}
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="proof-btn proof-btn-ghost"
            style={{
              padding: "10px 24px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: "1px solid var(--proof-border)",
            }}
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
