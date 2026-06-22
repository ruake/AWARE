import { AlertCircle, Home } from "lucide-react";
import { navTo } from "@/lib/data";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
        gap: 24,
        textAlign: "center",
        animation: "page-enter 0.5s ease-out both"
      }}
    >
      <div style={{ 
        width: 80, 
        height: 80, 
        borderRadius: "50%", 
        background: "var(--proof-red-bg)", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        marginBottom: 8
      }}>
        <AlertCircle size={40} style={{ color: "var(--proof-red)" }} />
      </div>
      
      <div>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "var(--proof-text)", margin: "0 0 8px 0", letterSpacing: "-0.02em" }}>
          404
        </h1>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: "var(--proof-text)", margin: "0 0 12px 0" }}>
          Page Not Found
        </h2>
        <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", margin: 0, maxWidth: 300, lineHeight: 1.5 }}>
          The page you are looking for doesn't exist or has been moved to a new location.
        </p>
      </div>

      <button 
        onClick={() => navTo("/dashboard")}
        className="proof-button-primary"
        style={{ padding: "10px 20px" }}
      >
        <Home size={16} />
        Back to Dashboard
      </button>
    </div>
  );
}
