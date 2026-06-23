import React from "react";
import { Home, Terminal } from "lucide-react";
import { navTo } from "@/lib/nav";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh",
        gap: 32,
        textAlign: "center",
        animation: "slide-up 0.5s ease-out both",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div 
        style={{
          position: "absolute",
          inset: 0,
          backgroundSize: "20px 20px",
          backgroundImage: "linear-gradient(to right, rgba(0, 196, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 196, 255, 0.05) 1px, transparent 1px)",
          zIndex: -1
        }}
      />
      
      <div style={{ position: "relative" }}>
        <h1 
          className="metric-number"
          style={{ 
            fontSize: "clamp(80px, 15vw, 150px)", 
            color: "var(--proof-text)", 
            margin: "0", 
            lineHeight: 1,
            textShadow: "4px 0 rgba(255,51,85,0.8), -4px 0 rgba(0,196,255,0.8)",
            animation: "glitch 2s infinite linear alternate-reverse"
          }}
        >
          404
        </h1>
        <div style={{ 
          position: "absolute", 
          bottom: "10%", 
          right: "-10%",
          color: "var(--proof-blue)",
          transform: "rotate(15deg)",
          opacity: 0.8
        }}>
          <Terminal size={48} strokeWidth={1.5} />
        </div>
      </div>
      
      <div style={{ zIndex: 1 }}>
        <h2 className="metric-number" style={{ fontSize: 24, color: "var(--proof-text)", margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          ROUTE NOT FOUND
        </h2>
        <p style={{ fontSize: 15, color: "var(--proof-text-secondary)", margin: 0, maxWidth: 350, lineHeight: 1.6 }}>
          The coordinates you entered lead to empty space. Let's get you back to the command center.
        </p>
      </div>

      <button 
        onClick={() => navTo("/")}
        className="proof-btn proof-btn-primary"
        style={{ padding: "12px 24px", fontSize: 15, zIndex: 1, boxShadow: "var(--proof-glow-cyan)", border: "1px solid rgba(0,196,255,0.3)" }}
      >
        <Home size={18} />
        Return to Dashboard
      </button>

      <style>{`
        @keyframes glitch {
          0% { text-shadow: 4px 0 rgba(255,51,85,0.8), -4px 0 rgba(0,196,255,0.8); transform: translate(0); }
          20% { text-shadow: -4px 0 rgba(255,51,85,0.8), 4px 0 rgba(0,196,255,0.8); transform: translate(-2px, 2px); }
          40% { text-shadow: 4px 0 rgba(255,51,85,0.8), -4px 0 rgba(0,196,255,0.8); transform: translate(2px, -2px); }
          60% { text-shadow: -4px 0 rgba(255,51,85,0.8), 4px 0 rgba(0,196,255,0.8); transform: translate(-2px, -2px); }
          80% { text-shadow: 4px 0 rgba(255,51,85,0.8), -4px 0 rgba(0,196,255,0.8); transform: translate(2px, 2px); }
          100% { text-shadow: -4px 0 rgba(255,51,85,0.8), 4px 0 rgba(0,196,255,0.8); transform: translate(0); }
        }
      `}</style>
    </div>
  );
}
