export function WebLLMWarning() {
  return (
    <div className="glass-panel" style={{ padding: 16, borderLeft: "3px solid var(--proof-blue)", borderRadius: "var(--proof-radius-lg)", marginBottom: 20 }}>
      <h4 style={{ margin: "0 0 8px 0", color: "var(--proof-text)", fontSize: 14 }}>Chrome AI Required</h4>
      <p style={{ margin: 0, color: "var(--proof-text-secondary)", fontSize: 13 }}>Please ensure you are using Chrome 138+ with the Prompt API enabled.</p>
    </div>
  );
}