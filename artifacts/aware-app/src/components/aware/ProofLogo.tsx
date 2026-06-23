import React from "react";

export function ProofLogo({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, display: "block" }}
    >
      <path d="M15 3 L26 9 L26 21 L15 27 L4 21 L4 9 Z" stroke="var(--proof-blue)" strokeWidth="1.5" fill="var(--proof-blue-bg)" />
      <path d="M4 9 L15 15 L26 9" stroke="var(--proof-blue)" strokeWidth="1.5" />
      <path d="M15 15 L15 27" stroke="var(--proof-blue)" strokeWidth="1.5" />
      <circle cx="15" cy="3" r="2" fill="var(--proof-blue-bright)" />
      <circle cx="26" cy="9" r="2" fill="var(--proof-blue-bright)" />
      <circle cx="26" cy="21" r="2" fill="var(--proof-blue-bright)" />
      <circle cx="15" cy="27" r="2" fill="var(--proof-blue-bright)" />
      <circle cx="4" cy="21" r="2" fill="var(--proof-blue-bright)" />
      <circle cx="4" cy="9" r="2" fill="var(--proof-blue-bright)" />
      <circle cx="15" cy="15" r="2.5" fill="var(--proof-blue-bright)" filter="drop-shadow(0 0 4px var(--proof-blue-glow))" />
    </svg>
  );
}
