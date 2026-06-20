import { Play, Github, GitCompare, ExternalLink } from "lucide-react";
import { navTo } from "@/lib/data";

export default function StartRun() {
  return (
    <div style={{ maxWidth: 600, margin: "60px auto" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div
          style={{
            width: 52,
            height: 52,
            background: "var(--proof-blue-bg)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Play size={26} color="var(--proof-blue)" />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Start a New Test Run</h1>
        <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", lineHeight: 1.6 }}>
          Trigger a new regression test run through GitHub Actions. Results appear in the Runs table
          once complete.
        </p>
      </div>

      <div
        className="proof-card"
        style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: 12,
            borderRadius: 6,
            border: "1px solid var(--proof-grey)",
            background: "var(--proof-grey-bg)",
          }}
        >
          <Github size={20} style={{ color: "var(--proof-text-secondary)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
              GitHub Actions Dispatch
            </div>
            <div style={{ fontSize: 12, color: "var(--proof-text-secondary)" }}>
              Trigger a workflow from the repository's Actions tab
            </div>
          </div>
          <a
            href="https://github.com/ruake/AWARE/actions"
            target="_blank" rel="noopener noreferrer"
            className="proof-button proof-button-sm"
            style={{ textDecoration: "none" }}
          >
            Open Actions <ExternalLink size={12} />
          </a>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: 12,
            borderRadius: 6,
            border: "1px solid var(--proof-grey)",
            background: "var(--proof-grey-bg)",
          }}
        >
          <GitCompare size={20} style={{ color: "var(--proof-text-secondary)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
              Compare Existing Runs
            </div>
            <div style={{ fontSize: 12, color: "var(--proof-text-secondary)" }}>
              Review baseline vs candidate differences
            </div>
          </div>
          <button
            onClick={() => navTo("/compare")}
            className="proof-button proof-button-sm"
          >
            Compare <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
