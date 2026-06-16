import React from "react";
import type { TestCase } from "@/lib/types";
import { getGitHubUrl, cleanScriptPath } from "@/lib/utils";
import { Beaker, ArrowDown, Globe, ShieldCheck, Image, Eye, FileCode } from "lucide-react";

function FlowStep({
  icon,
  title,
  label,
  color,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  label?: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: `1px solid ${color}`,
        borderRadius: 8,
        padding: 12,
        background: `color-mix(in srgb, ${color} 6%, var(--proof-surface))`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--proof-text)" }}>{title}</span>
        {label && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              padding: "1px 6px",
              borderRadius: 4,
              background: color,
              color: "#fff",
              fontWeight: 600,
            }}
          >
            {label}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function ArrowConnector() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 0",
        color: "var(--proof-text-secondary)",
      }}
    >
      <ArrowDown size={16} />
    </div>
  );
}

function Pill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontFamily: "var(--font-mono)",
        background: color ? `${color}15` : "var(--proof-grey-bg)",
        border: `1px solid ${color || "var(--proof-grey)"}`,
        color: color || "var(--proof-text)",
      }}
    >
      <span style={{ fontWeight: 500, color: "var(--proof-text-secondary)" }}>{label}:</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function PredicateRow({
  label,
  expected,
  operator,
  status,
}: {
  label: string;
  expected: string;
  operator: string;
  status?: "pass" | "fail";
}) {
  const opSymbol =
    operator === "equals"
      ? "="
      : operator === "contains"
        ? "∋"
        : operator === "gt"
          ? ">"
          : operator === "lt"
            ? "<"
            : operator === "exists"
              ? "∃"
              : operator;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 8px",
        fontSize: 11,
        fontFamily: "var(--font-mono)",
        borderBottom: "1px solid var(--proof-grey)",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background:
            status === "pass"
              ? "var(--proof-green)"
              : status === "fail"
                ? "var(--proof-red)"
                : "var(--proof-grey)",
          flexShrink: 0,
        }}
      />
      <span style={{ color: "var(--proof-text-secondary)", flexShrink: 0 }}>{label}</span>
      <span style={{ color: "var(--proof-blue)", fontWeight: 600 }}>{opSymbol}</span>
      <span style={{ color: "var(--proof-text)", fontWeight: 600 }}>{expected}</span>
    </div>
  );
}

export function TestFlowDiagram({ testCase }: { testCase: TestCase }) {
  const typeColors: Record<string, string> = {
    web: "var(--proof-blue)",
    api: "var(--proof-green)",
    http: "#00bcd4",
    edgeworker: "var(--proof-yellow)",
    transaction: "var(--proof-purple, #a855f7)",
  };
  const color = typeColors[testCase.testType] || "var(--proof-blue)";

  const hasHeaders = Object.keys(testCase.requestHeaders).length > 0;
  const hasCookies = Object.keys(testCase.cookies).length > 0;
  const hasPredicates = testCase.predicates.length > 0;
  const hasAssertions = testCase.assertions.length > 0;
  const hasFilmstrip = testCase.filmstrip.enabled;
  const hasCaptureHeaders = testCase.captureResponseHeaders.length > 0;

  return (
    <div
      className="proof-card"
      style={{
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Beaker size={16} style={{ color }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--proof-text)" }}>
          Test Flow: {testCase.name}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            padding: "2px 8px",
            borderRadius: 4,
            background: `${color}15`,
            border: `1px solid ${color}`,
            color,
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          {testCase.testType}
        </span>
      </div>

      {/* Step 1: Request Configuration */}
      <FlowStep icon={<Globe size={14} />} title="Request" color={color}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            marginBottom: hasHeaders || hasCookies ? 8 : 0,
          }}
        >
          {testCase.expectedStatus && (
            <Pill label="Expected" value={String(testCase.expectedStatus)} color={color} />
          )}
          {testCase.config.timeout && (
            <Pill label="Timeout" value={`${testCase.config.timeout}ms`} />
          )}
          {testCase.config.retries && testCase.config.retries > 0 && (
            <Pill label="Retries" value={String(testCase.config.retries)} />
          )}
          {testCase.config.baseUrl && <Pill label="Base" value={testCase.config.baseUrl} />}
          {testCase.automated !== undefined && (
            <Pill
              label="Auto"
              value={testCase.automated ? "Yes" : "No"}
              color={testCase.automated ? "var(--proof-green)" : "var(--proof-yellow)"}
            />
          )}
        </div>

        {/* Request grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
          {hasHeaders && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--proof-text-secondary)",
                  marginBottom: 4,
                }}
              >
                Headers ({Object.keys(testCase.requestHeaders).length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {Object.entries(testCase.requestHeaders)
                  .slice(0, 4)
                  .map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        fontSize: 10,
                        fontFamily: "var(--font-mono)",
                        padding: "2px 6px",
                        background: "var(--proof-surface)",
                        borderRadius: 3,
                        border: "1px solid var(--proof-grey)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={`${k}: ${v}`}
                    >
                      <span style={{ color: "var(--proof-blue)" }}>{k}</span>
                      <span style={{ color: "var(--proof-text-secondary)" }}>: {String(v)}</span>
                    </div>
                  ))}
                {Object.keys(testCase.requestHeaders).length > 4 && (
                  <span style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>
                    +{Object.keys(testCase.requestHeaders).length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}
          {hasCookies && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--proof-text-secondary)",
                  marginBottom: 4,
                }}
              >
                Cookies ({Object.keys(testCase.cookies).length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {Object.entries(testCase.cookies)
                  .slice(0, 3)
                  .map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        fontSize: 10,
                        fontFamily: "var(--font-mono)",
                        padding: "2px 6px",
                        background: "var(--proof-surface)",
                        borderRadius: 3,
                        border: "1px solid var(--proof-grey)",
                      }}
                    >
                      <span style={{ color: "var(--proof-yellow)" }}>{k}</span>
                      <span style={{ color: "var(--proof-text-secondary)" }}>={String(v)}</span>
                    </div>
                  ))}
                {Object.keys(testCase.cookies).length > 3 && (
                  <span style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>
                    +{Object.keys(testCase.cookies).length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Expected behavior */}
        {testCase.expectedBehavior && (
          <div
            style={{
              marginTop: 8,
              padding: "6px 8px",
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              background: "var(--proof-grey-bg)",
              borderRadius: 4,
              color: "var(--proof-text-secondary)",
              lineHeight: 1.5,
              maxHeight: 48,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {testCase.expectedBehavior.slice(0, 200)}
          </div>
        )}
      </FlowStep>

      <ArrowConnector />

      {/* Step 2: Predicates & Assertions */}
      <FlowStep
        icon={<ShieldCheck size={14} />}
        title="Validation Rules"
        color="var(--proof-green)"
        label={String(
          (hasPredicates ? testCase.predicates.length : 0) +
            (hasAssertions ? testCase.assertions.length : 0),
        )}
      >
        {hasPredicates ? (
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--proof-text-secondary)",
                marginBottom: 4,
              }}
            >
              Predicates
            </div>
            <div
              style={{
                border: "1px solid var(--proof-grey)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              {testCase.predicates.map((p) => (
                <PredicateRow
                  key={p.id}
                  label={p.description || p.type}
                  expected={p.expected}
                  operator={p.operator}
                />
              ))}
            </div>
          </div>
        ) : hasAssertions ? (
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--proof-text-secondary)",
                marginBottom: 4,
              }}
            >
              Assertions
            </div>
            <div
              style={{
                border: "1px solid var(--proof-grey)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              {testCase.assertions.map((a) => (
                <PredicateRow
                  key={a.id}
                  label={a.description || a.type}
                  expected={a.expected}
                  operator={a.operator}
                />
              ))}
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: 11,
              color: "var(--proof-text-secondary)",
              fontStyle: "italic",
              padding: "4px 0",
            }}
          >
            No validation rules defined
          </div>
        )}

        {hasCaptureHeaders && (
          <div style={{ marginTop: 8 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--proof-text-secondary)",
                marginBottom: 4,
              }}
            >
              Captured Response Headers
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {testCase.captureResponseHeaders.map((h) => (
                <span
                  key={h}
                  style={{
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                    padding: "2px 6px",
                    background: "var(--proof-blue-bg)",
                    borderRadius: 3,
                    color: "var(--proof-blue)",
                    border: "1px solid var(--proof-blue)",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}
      </FlowStep>

      {(hasFilmstrip || testCase.preconditions) && <ArrowConnector />}

      {/* Step 3: Filmstrip */}
      {hasFilmstrip && (
        <FlowStep
          icon={<Image size={14} />}
          title="Visual Comparison"
          color="var(--proof-purple, #a855f7)"
          label={`${Math.round(testCase.filmstrip.threshold * 100)}%`}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            <Pill label="Mode" value={testCase.filmstrip.mode} />
            <Pill label="Threshold" value={`${Math.round(testCase.filmstrip.threshold * 100)}%`} />
            {testCase.filmstrip.captureOnFailure && (
              <Pill label="Capture" value="On Failure" color="var(--proof-yellow)" />
            )}
            <Pill label="Max" value={`${testCase.filmstrip.maxFrames} frames`} />
            {testCase.filmstrip.region && (
              <Pill label="Region" value={testCase.filmstrip.region} />
            )}
            {testCase.filmstrip.ignoreAreas && testCase.filmstrip.ignoreAreas.length > 0 && (
              <Pill label="Ignores" value={`${testCase.filmstrip.ignoreAreas.length} areas`} />
            )}
          </div>
        </FlowStep>
      )}

      {/* Preconditions */}
      {testCase.preconditions && (
        <>
          <ArrowConnector />
          <FlowStep icon={<FileCode size={14} />} title="Preconditions" color="var(--proof-yellow)">
            <div
              style={{
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                lineHeight: 1.6,
                color: "var(--proof-text-secondary)",
                whiteSpace: "pre-wrap",
                maxHeight: 80,
                overflow: "hidden",
              }}
            >
              {testCase.preconditions}
            </div>
          </FlowStep>
        </>
      )}

      {/* Result indicator */}
      <div
        style={{
          marginTop: 10,
          padding: "8px 12px",
          borderRadius: 6,
          background: "var(--proof-grey-bg)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 11,
          color: "var(--proof-text-secondary)",
          border: "1px dashed var(--proof-grey)",
        }}
      >
        <Eye size={14} />
        <span>
          Script:{" "}
          {testCase.scriptPath ? (
            <a
              href={getGitHubUrl(testCase)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--proof-blue)",
                fontSize: 10,
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              <code style={{ fontFamily: "inherit", color: "inherit", fontSize: "inherit" }}>
                {cleanScriptPath(testCase)}
              </code>
            </a>
          ) : (
            <code
              style={{ fontFamily: "var(--font-mono)", color: "var(--proof-blue)", fontSize: 10 }}
            >
              not set
            </code>
          )}
        </span>
        <span style={{ marginLeft: "auto", opacity: 0.5 }}>
          v{testCase.version} · {new Date(testCase.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
