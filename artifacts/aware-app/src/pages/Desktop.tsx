import React from "react";
import { AppLayout } from "@/components/aware/AppLayout";
import { Monitor, ExternalLink, RefreshCw, Maximize2, Terminal, Globe } from "lucide-react";

const NOVNC_PORT = 8080;

function getNoVncUrl() {
  const host = window.location.hostname;
  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  return `${protocol}//${host}:${NOVNC_PORT}/vnc.html?autoconnect=true&resize=scale&quality=6&compression=2`;
}

function getWsUrl() {
  const host = window.location.hostname;
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${host}:${NOVNC_PORT}`;
}

export default function Desktop() {
  const [status, setStatus] = React.useState<"checking" | "ready" | "unavailable">("checking");
  const [fullscreen, setFullscreen] = React.useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const novncUrl = getNoVncUrl();

  React.useEffect(() => {
    let attempts = 0;
    const maxAttempts = 30;

    const check = () => {
      fetch(`http://${window.location.hostname}:${NOVNC_PORT}/vnc.html`, {
        method: "HEAD",
        mode: "no-cors",
      })
        .then(() => setStatus("ready"))
        .catch(() => {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(check, 2000);
          } else {
            setStatus("unavailable");
          }
        });
    };

    check();
  }, []);

  const reload = () => {
    setStatus("checking");
    if (iframeRef.current) {
      iframeRef.current.src = novncUrl;
    }
    setTimeout(() => setStatus("ready"), 1000);
  };

  return (
    <AppLayout activeHref="/desktop">
      <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "calc(100vh - 120px)" }}>

        {/* Header bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <Monitor size={20} style={{ color: "var(--gcp-blue)" }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--gcp-text)" }}>Desktop</div>
            <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>
              noVNC · Firefox + Terminal running on Xvnc display :99
            </div>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            {/* Status pill */}
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
              background: status === "ready" ? "var(--gcp-green-bg)" : status === "unavailable" ? "var(--gcp-red-bg)" : "var(--gcp-blue-bg)",
              color: status === "ready" ? "var(--gcp-green)" : status === "unavailable" ? "var(--gcp-red)" : "var(--gcp-blue)",
              border: `1px solid ${status === "ready" ? "var(--gcp-green)" : status === "unavailable" ? "var(--gcp-red)" : "var(--gcp-blue)"}`,
            }}>
              {status === "ready" ? "● Connected" : status === "unavailable" ? "● Unavailable" : "○ Connecting…"}
            </span>

            <button
              onClick={reload}
              title="Reload viewer"
              style={{ padding: 6, border: "1px solid var(--gcp-grey)", borderRadius: 4, background: "var(--gcp-surface)", cursor: "pointer", color: "var(--gcp-text-secondary)", display: "flex", alignItems: "center" }}
            >
              <RefreshCw size={14} />
            </button>

            <button
              onClick={() => setFullscreen(f => !f)}
              title="Toggle fullscreen"
              style={{ padding: 6, border: "1px solid var(--gcp-grey)", borderRadius: 4, background: "var(--gcp-surface)", cursor: "pointer", color: "var(--gcp-text-secondary)", display: "flex", alignItems: "center" }}
            >
              <Maximize2 size={14} />
            </button>

            <a
              href={novncUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in new tab"
              style={{ padding: 6, border: "1px solid var(--gcp-grey)", borderRadius: 4, background: "var(--gcp-surface)", cursor: "pointer", color: "var(--gcp-blue)", display: "flex", alignItems: "center", textDecoration: "none" }}
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Info strip */}
        <div style={{
          display: "flex", gap: 16, padding: "8px 14px",
          background: "var(--gcp-surface)", border: "1px solid var(--gcp-grey)",
          borderRadius: 6, fontSize: 12, color: "var(--gcp-text-secondary)", flexShrink: 0,
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Globe size={12} style={{ color: "var(--gcp-blue)" }} />
            Firefox → <code style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>localhost:20857</code>
          </span>
          <span style={{ color: "var(--gcp-grey)" }}>|</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Terminal size={12} style={{ color: "var(--gcp-green)" }} />
            xterm bash shell
          </span>
          <span style={{ color: "var(--gcp-grey)" }}>|</span>
          <span>Resolution: 1280×720</span>
          <span style={{ color: "var(--gcp-grey)" }}>|</span>
          <span>Display: :99</span>
        </div>

        {/* noVNC iframe or status message */}
        <div style={{
          flex: 1, border: "1px solid var(--gcp-grey)", borderRadius: 8, overflow: "hidden",
          background: "#0d1117", position: "relative",
          ...(fullscreen ? {
            position: "fixed", inset: 0, zIndex: 200, borderRadius: 0,
          } : {}),
        }}>
          {status === "unavailable" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16, color: "var(--gcp-text-secondary)" }}>
              <Monitor size={48} style={{ opacity: 0.3 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--gcp-text)" }}>Desktop not running</div>
              <div style={{ fontSize: 12, maxWidth: 400, textAlign: "center", lineHeight: 1.7 }}>
                Start the <strong>desktop</strong> workflow to launch the VNC desktop with Firefox and Terminal.
                <br />
                Run: <code style={{ fontFamily: "var(--font-mono)", fontSize: 11, background: "var(--gcp-grey-bg)", padding: "1px 6px", borderRadius: 3 }}>bash scripts/start-desktop.sh</code>
              </div>
              <button
                onClick={reload}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "var(--gcp-blue)", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
              >
                <RefreshCw size={14} /> Retry connection
              </button>
            </div>
          ) : (
            <>
              {status === "checking" && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "var(--gcp-text-secondary)", zIndex: 1, background: "#0d1117" }}>
                  <Monitor size={40} style={{ opacity: 0.4, color: "var(--gcp-blue)" }} />
                  <div style={{ fontSize: 13 }}>Connecting to noVNC…</div>
                  <div style={{ width: 200, height: 3, background: "var(--gcp-grey)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: "40%", background: "var(--gcp-blue)", borderRadius: 2, animation: "slide-up 1.5s ease-in-out infinite" }} />
                  </div>
                </div>
              )}
              <iframe
                ref={iframeRef}
                src={novncUrl}
                style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                allow="fullscreen"
                title="noVNC Desktop"
              />
            </>
          )}

          {fullscreen && (
            <button
              onClick={() => setFullscreen(false)}
              style={{
                position: "absolute", top: 12, right: 12, zIndex: 210,
                padding: "6px 12px", background: "rgba(0,0,0,0.7)", color: "white",
                border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, cursor: "pointer",
                fontSize: 12, fontWeight: 600, backdropFilter: "blur(4px)",
              }}
            >
              Exit fullscreen (Esc)
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
