import React from "react";

interface PrintableReportProps {
  title: string;
  subtitle?: string;
  metadata: Record<string, string>;
  children: React.ReactNode;
}

export function PrintableReport({ title, subtitle, metadata, children }: PrintableReportProps) {
  const timestamp = new Date().toLocaleString();
  const pageNumRef = React.useRef(1);

  React.useEffect(() => {
    pageNumRef.current = 1;
  }, []);

  return (
    <div
      className="printable-report"
      style={{
        padding: 0,
        fontFamily: "var(--font-sans)",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      {/* Metadata header */}
      <div
        className="printable-report-header"
        style={{
          padding: "24px 32px",
          borderBottom: "2px solid #000",
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              margin: "0 0 8px",
              color: "#000",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: 13,
                color: "#555",
                margin: 0,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#666",
            textAlign: "right",
            lineHeight: 1.6,
          }}
        >
          {Object.entries(metadata).map(([key, value]) => (
            <div key={key}>
              <strong>{key}:</strong> {value}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="printable-report-body">{children}</div>

      {/* Footer */}
      <div
        className="printable-report-footer"
        style={{
          marginTop: 32,
          paddingTop: 12,
          borderTop: "1px solid #ccc",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          color: "#888",
        }}
      >
        <span>Generated: {timestamp}</span>
        <span className="printable-report-page" />
        <span>Source: AWARE — Akamai Web Analytics Regression Engine</span>
      </div>

      <style>{`
        @media print {
          .printable-report {
            padding: 0 !important;
          }
          .printable-report-header {
            break-inside: avoid;
          }
          .printable-report-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            padding: 8px 32px;
          }
          .printable-report-page::after {
            content: "Page " counter(page);
          }
        }
      `}</style>
    </div>
  );
}
