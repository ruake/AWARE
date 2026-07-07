import React, { useState, useEffect } from "react";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

type Breakpoint = "mobile" | "tablet" | "desktop";

function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() => {
    if (typeof window === "undefined") return "desktop";
    const w = window.innerWidth;
    if (w <= 768) return "mobile";
    if (w <= 1024) return "tablet";
    return "desktop";
  });

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      if (w <= 768) setBp("mobile");
      else if (w <= 1024) setBp("tablet");
      else setBp("desktop");
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return bp;
}

export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const bp = useBreakpoint();

  const padding = bp === "mobile" ? "0" : bp === "tablet" ? "0" : "0";

  return (
    <div
      style={{
        padding,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </div>
  );
}
