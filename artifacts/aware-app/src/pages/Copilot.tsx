import React from "react";
import { AppLayout } from "@/components/aware/AppLayout";
import { Bot } from "lucide-react";

export default function Copilot() {
  return (
    <AppLayout activeHref="/copilot">
      <div style={{ maxWidth: 500, margin: "60px auto", textAlign: "center" }}>
        <div style={{ width: 48, height: 48, background: "var(--gcp-blue-bg)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Bot size={22} color="var(--gcp-blue)" />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Copilot</h2>
        <p style={{ fontSize: 13, color: "var(--gcp-text-secondary)", lineHeight: 1.6 }}>
          Copilot is currently unavailable in this read-only release.
        </p>
      </div>
    </AppLayout>
  );
}
