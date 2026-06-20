import type { TestEvidence } from "@/lib/types";

export function EvidenceViewer({ evidence }: { evidence: TestEvidence | null }) {
  if (!evidence) {
    return (
      <div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "var(--proof-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: 6,
          }}
        >
          HTTP Exchange
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--proof-text-secondary)",
            fontStyle: "italic",
          }}
        >
          No HTTP data captured
        </div>
      </div>
    );
  }

  const rows: { label: string; val: string }[] = [];
  rows.push({ label: "Method", val: evidence.request.method });
  rows.push({ label: "URL", val: evidence.request.url });
  rows.push({ label: "Status", val: String(evidence.response.status) });
  const ct = evidence.response.headers?.["Content-Type"] ?? "";
  if (ct) rows.push({ label: "Content-Type", val: ct });
  const cl = evidence.response.headers?.["Content-Length"] ?? "";
  if (cl) rows.push({ label: "Size", val: cl + " bytes" });
  const cache = evidence.response.headers?.["Cache-Control"] ?? "";
  if (cache) rows.push({ label: "Cache", val: cache });

  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "var(--proof-text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: 6,
        }}
      >
        HTTP Exchange
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          fontSize: 11,
          fontFamily: "var(--font-mono)",
        }}
      >
        {rows.map((r) => (
          <div key={r.label} style={{ display: "flex", gap: 6 }}>
            <span
              style={{
                color: "var(--proof-text-secondary)",
                width: 80,
                flexShrink: 0,
              }}
            >
              {r.label}
            </span>
            <span style={{ color: "var(--proof-text)", wordBreak: "break-all" }}>
              {r.val}
            </span>
          </div>
        ))}
      </div>

      {evidence.response.headers && Object.keys(evidence.response.headers).length > 0 && (
        <details open style={{ marginTop: 8, fontSize: 11 }}>
          <summary
            style={{
              cursor: "pointer",
              color: "var(--proof-text-secondary)",
              fontWeight: 600,
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Response Headers ({Object.keys(evidence.response.headers).length})
          </summary>
          <div
            style={{
              marginTop: 4,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {Object.entries(evidence.response.headers).map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  gap: 6,
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                }}
              >
                <span style={{ color: "var(--proof-blue)", minWidth: 140 }}>
                  {k}
                </span>
                <span
                  style={{ color: "var(--proof-text)", wordBreak: "break-all" }}
                >
                  {v}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      {evidence.request.headers && Object.keys(evidence.request.headers).length > 0 && (
        <details open style={{ marginTop: 6, fontSize: 11 }}>
          <summary
            style={{
              cursor: "pointer",
              color: "var(--proof-text-secondary)",
              fontWeight: 600,
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Request Headers ({Object.keys(evidence.request.headers).length})
          </summary>
          <div
            style={{
              marginTop: 4,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {Object.entries(evidence.request.headers).map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  gap: 6,
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                }}
              >
                <span style={{ color: "var(--proof-purple)", minWidth: 140 }}>
                  {k}
                </span>
                <span
                  style={{ color: "var(--proof-text)", wordBreak: "break-all" }}
                >
                  {v}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      {evidence.response.cookies && evidence.response.cookies.length > 0 && (
        <details open style={{ marginTop: 6, fontSize: 11 }}>
          <summary
            style={{
              cursor: "pointer",
              color: "var(--proof-text-secondary)",
              fontWeight: 600,
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Cookies ({evidence.response.cookies.length})
          </summary>
          <div
            style={{
              marginTop: 4,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {evidence.response.cookies.map((c, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 6,
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  padding: "4px 6px",
                  background: "var(--proof-grey-bg)",
                  borderRadius: 4,
                }}
              >
                <span style={{ color: "var(--proof-orange)", fontWeight: 600 }}>
                  {c.name}
                </span>
                <span style={{ color: "var(--proof-text)", wordBreak: "break-all" }}>
                  = {c.value}
                </span>
                {c.domain && (
                  <span style={{ color: "var(--proof-text-secondary)" }}>
                    domain={c.domain}
                  </span>
                )}
                {c.path && (
                  <span style={{ color: "var(--proof-text-secondary)" }}>
                    path={c.path}
                  </span>
                )}
                {c.httpOnly && (
                  <span style={{ color: "var(--proof-green)" }}>HttpOnly</span>
                )}
                {c.secure && (
                  <span style={{ color: "var(--proof-green)" }}>Secure</span>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
