import React from "react";
import { X, Info, ExternalLink, Zap, CheckCircle, AlertCircle } from "lucide-react";

interface CopilotSettingsProps {
  onClose: () => void;
}

export function CopilotSettings({ onClose }: CopilotSettingsProps) {
  const [status, setStatus] = React.useState<"checking" | "available" | "unavailable" | "downloading">("checking");

  const checkStatus = React.useCallback(async () => {
    setStatus("checking");
    // Simple availability check
    if (typeof (window as any).LanguageModel?.availability === "function") {
      const res = await (window as any).LanguageModel.availability();
      setStatus(res === "downloadable" || res === "downloading" ? "downloading" : res);
    } else if (typeof (window as any).ai?.languageModel?.capabilities === "function") {
      const cap = await (window as any).ai.languageModel.capabilities();
      const avail = typeof cap === "object" ? cap.available : cap;
      if (avail === "readily") setStatus("available");
      else if (avail === "after-download") setStatus("downloading");
      else setStatus("unavailable");
    } else {
      setStatus("unavailable");
    }
  }, []);

  React.useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const copyFlag = () => {
    navigator.clipboard.writeText("chrome://flags/#prompt-api-for-gemini-nano");
  };

  return (
    <div
      style={{
        borderBottom: "1px solid var(--proof-border)",
        padding: "16px 20px",
        background: "var(--proof-overlay)",
        backdropFilter: "blur(10px)",
        flexShrink: 0,
        animation: "slide-down 0.15s ease-out",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Zap size={16} style={{ color: "var(--proof-blue)" }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--proof-text)" }}>
            Chrome AI (Gemini Nano)
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--proof-text-muted)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Status Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "var(--proof-text-secondary)" }}>Status:</span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              background:
                status === "available"
                  ? "rgba(0, 220, 130, 0.1)"
                  : status === "unavailable"
                    ? "rgba(255, 77, 107, 0.1)"
                    : "rgba(91, 138, 255, 0.1)",
              color:
                status === "available"
                  ? "var(--proof-emerald)"
                  : status === "unavailable"
                    ? "var(--proof-red)"
                    : "var(--proof-blue)",
              border: `1px solid ${
                status === "available"
                  ? "rgba(0, 220, 130, 0.2)"
                  : status === "unavailable"
                    ? "rgba(255, 77, 107, 0.2)"
                    : "rgba(91, 138, 255, 0.2)"
              }`,
            }}
          >
            {status === "available" && <CheckCircle size={12} />}
            {status === "unavailable" && <AlertCircle size={12} />}
            {status === "checking" && (
              <Zap size={12} style={{ animation: "pulse 1.5s infinite" }} />
            )}
            {status === "downloading" && (
              <Zap size={12} style={{ animation: "pulse 1.5s infinite" }} />
            )}
            {status.toUpperCase()}
          </div>
          <button
            onClick={checkStatus}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 11,
              color: "var(--proof-blue)",
              textDecoration: "underline",
              padding: 0,
            }}
          >
            Refresh
          </button>
        </div>

        {status === "unavailable" && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: "rgba(255, 77, 107, 0.05)",
              border: "1px solid rgba(255, 77, 107, 0.15)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color: "var(--proof-red)",
              }}
            >
              <Info size={14} /> Setup Required
            </div>
            <p style={{ fontSize: 11, color: "var(--proof-text-secondary)", lineHeight: 1.5, margin: 0 }}>
              To enable on-device AI, you must be using Chrome 128+ and enable the following flags:
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(0,0,0,0.2)",
                padding: "6px 10px",
                borderRadius: 4,
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                color: "var(--proof-text)",
              }}
            >
              <span>chrome://flags/#prompt-api-for-gemini-nano</span>
              <button
                onClick={copyFlag}
                style={{
                  background: "var(--proof-blue)",
                  color: "white",
                  border: "none",
                  borderRadius: 3,
                  padding: "2px 6px",
                  fontSize: 9,
                  cursor: "pointer",
                }}
              >
                Copy
              </button>
            </div>
            <a
              href="https://developer.chrome.com/docs/ai/built-in"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 11,
                color: "var(--proof-blue)",
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginTop: 4,
              }}
            >
              Learn more <ExternalLink size={10} />
            </a>
          </div>
        )}

        {status === "available" && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: "rgba(0, 220, 130, 0.05)",
              border: "1px solid rgba(0, 220, 130, 0.15)",
              fontSize: 11,
              color: "var(--proof-text-secondary)",
              lineHeight: 1.5,
            }}
          >
            Ready to use! Gemini Nano is running locally on your machine. No data leaves your browser.
          </div>
        )}

        <button
          onClick={() => {
            const ev = new CustomEvent("copilot-ping");
            window.dispatchEvent(ev);
          }}
          className="proof-button-primary"
          style={{ width: "100%", height: 36, fontSize: 12 }}
        >
          Test Connection
        </button>
      </div>
    </div>
  );
}
