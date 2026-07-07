import React from "react";
import { Printer } from "lucide-react";

interface PrintButtonProps {
  label?: string;
  variant?: "icon" | "text";
}

export function PrintButton({ label = "Print", variant = "text" }: PrintButtonProps) {
  return (
    <button
      onClick={() => window.print()}
      className={variant === "icon" ? undefined : "proof-btn proof-btn-ghost"}
      style={
        variant === "icon"
          ? {
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 8,
              border: "1px solid var(--proof-border)",
              background: "transparent",
              color: "var(--proof-text-secondary)",
              cursor: "pointer",
              transition: "all var(--proof-transition)",
            }
          : {
              fontSize: 13,
              fontWeight: 600,
              border: "1px solid var(--proof-border)",
            }
      }
      title={label}
      aria-label={label}
    >
      <Printer size={variant === "icon" ? 16 : 14} />
      {variant !== "icon" && <span>{label}</span>}
    </button>
  );
}
