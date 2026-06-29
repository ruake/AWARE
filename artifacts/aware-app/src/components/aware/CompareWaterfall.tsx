import type { TestResult } from "@/lib/types";

const WATERFALL_PHASES = [
  { name: "DNS", pct: 0.06, color: "var(--proof-purple)" },
  { name: "TCP", pct: 0.04, color: "var(--proof-blue)" },
  { name: "TLS", pct: 0.1, color: "#38bdf8" },
  { name: "Request", pct: 0.02, color: "var(--proof-text-muted)" },
  { name: "TTFB", pct: 0.66, color: "var(--proof-yellow)" },
  { name: "Download", pct: 0.12, color: "var(--proof-emerald)" },
];

function WaterfallSide({ result, label }: { result: TestResult | null; label: string }) {
  if (!result) {
    return (
      <div
        style={{
          padding: "8px 10px",
          background: "var(--proof-grey-bg)",
          borderRadius: 4,
          border: "1px solid var(--proof-grey)",
          minHeight: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>No data</span>
      </div>
    );
  }

  const phases = WATERFALL_PHASES.map((p) => ({
    ...p,
    ms: Math.max(1, Math.round(result.duration * p.pct)),
  }));
  const maxMs = Math.max(...phases.map((p) => p.ms));
  const statusColor = result.status === "PASS" ? "var(--proof-green)" : "var(--proof-red)";

  return (
    <div
      style={{
        padding: "8px 10px",
        background: "var(--proof-grey-bg)",
        borderRadius: 4,
        border: `1px solid ${result.status === "PASS" ? "var(--proof-green)" : "var(--proof-red)"}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "var(--proof-text-secondary)",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: statusColor,
            fontFamily: "var(--font-mono)",
          }}
        >
          {result.status} · {result.duration}ms
        </span>
      </div>

      {phases.map((ph) => (
        <div
          key={ph.name}
          style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}
        >
          <span
            style={{
              fontSize: 8,
              width: 46,
              flexShrink: 0,
              color: "var(--proof-text-secondary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {ph.name}
          </span>
          <div
            style={{
              flex: 1,
              background: "var(--proof-grey)",
              borderRadius: 2,
              height: 5,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.round((ph.ms / maxMs) * 100)}%`,
                height: "100%",
                background: ph.color,
                borderRadius: 2,
                minWidth: 3,
                transition: "width 0.3s",
              }}
            />
          </div>
          <span
            style={{
              fontSize: 8,
              width: 32,
              textAlign: "right",
              color: "var(--proof-text-secondary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {ph.ms}ms
          </span>
        </div>
      ))}

      {result.evidence?.response?.headers && (
        <div style={{ marginTop: 7, paddingTop: 6, borderTop: "1px solid var(--proof-grey)" }}>
          {Object.entries(result.evidence.response.headers)
            .slice(0, 3)
            .map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 4, marginBottom: 2 }}>
                <span
                  style={{
                    fontSize: 8,
                    color: "var(--proof-text-secondary)",
                    fontFamily: "var(--font-mono)",
                    flexShrink: 0,
                  }}
                >
                  {k}:
                </span>
                <span
                  style={{
                    fontSize: 8,
                    color: "var(--proof-text)",
                    fontFamily: "var(--font-mono)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {String(v)}
                </span>
              </div>
            ))}
        </div>
      )}

      {result.assertions && result.assertions.length > 0 && (
        <div style={{ marginTop: 7, paddingTop: 6, borderTop: "1px solid var(--proof-grey)" }}>
          {result.assertions.map((a, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "flex-start", gap: 4, marginBottom: 3 }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: a.passed ? "var(--proof-green)" : "var(--proof-red)",
                  flexShrink: 0,
                  lineHeight: 1.2,
                }}
              >
                {a.passed ? "✓" : "✗"}
              </span>
              <div
                style={{
                  fontSize: 8,
                  color: "var(--proof-text)",
                  lineHeight: 1.4,
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    display: "block",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {a.assertion}
                </span>
                {!a.passed && (
                  <span
                    style={{
                      display: "block",
                      color: "var(--proof-red)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    exp {a.expected} · got {a.actual}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {result.filmstrip && result.filmstrip.length > 0 && (
        <div
          style={{
            marginTop: 7,
            paddingTop: 6,
            borderTop: "1px solid var(--proof-grey)",
            display: "flex",
            gap: 4,
            overflowX: "auto",
          }}
        >
          {result.filmstrip.map((frame) => (
            <div key={frame.id} style={{ flexShrink: 0, textAlign: "center" }}>
              <img
                src={frame.dataUri || frame.imageUrl}
                alt={frame.label}
                style={{
                  width: 56,
                  height: 40,
                  objectFit: "cover",
                  borderRadius: 3,
                  border: "1px solid var(--proof-grey)",
                  display: "block",
                }}
              />
              <span
                style={{
                  fontSize: 7,
                  color: "var(--proof-text-secondary)",
                  display: "block",
                  marginTop: 2,
                }}
              >
                {frame.label}
              </span>
              {frame.timestamp !== undefined && (
                <span
                  style={{
                    fontSize: 7,
                    color: "var(--proof-text-secondary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {frame.timestamp}ms
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CompareWaterfall({
  baseResult,
  candResult,
}: {
  baseResult: TestResult | null;
  candResult: TestResult | null;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
      <WaterfallSide result={baseResult} label="Baseline" />
      <WaterfallSide result={candResult} label="Candidate" />
    </div>
  );
}
