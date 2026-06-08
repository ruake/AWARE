import { AppLayout } from "@/components/aware/AppLayout";
import { Play } from "lucide-react";

export default function StartRun() {
  return (
    <AppLayout activeHref="/runs">
      <div style={{ maxWidth: 500, margin: "60px auto", textAlign: "center" }}>
        <div style={{ width: 48, height: 48, background: "var(--gcp-blue-bg)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Play size={22} color="var(--gcp-blue)" />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Start Run</h2>
        <p style={{ fontSize: 13, color: "var(--gcp-text-secondary)", lineHeight: 1.6 }}>
          Run configuration is not available in this read-only release. Test runs are triggered from your CI pipeline.
        </p>
      </div>
    </AppLayout>
  );
}
