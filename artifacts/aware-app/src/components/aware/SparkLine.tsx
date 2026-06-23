import React from "react";

export function SparkLine({ data, color }: any) {
  if (!data || !data.length) return null;
  return (
    <div style={{ height: 24, width: 64, opacity: 0.7 }}>
      <svg width="100%" height="100%" viewBox="0 0 100 24" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={data.map((v: number, i: number) => `${(i / (data.length - 1)) * 100},${24 - (v / 100) * 24}`).join(" ")}
        />
      </svg>
    </div>
  );
}
