import React from "react";

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  side: "left" | "right";
  collapsed?: boolean;
  collapsedWidth?: number;
  onResize?: (width: number) => void;
}

export function ResizablePanel({
  children,
  defaultWidth = 280,
  minWidth = 180,
  maxWidth = 500,
  side,
  collapsed = false,
  collapsedWidth = 50,
  onResize,
}: ResizablePanelProps) {
  const [width, setWidth] = React.useState(defaultWidth);
  const [isDragging, setIsDragging] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const dragRef = React.useRef<{
    startX: number;
    startWidth: number;
  } | null>(null);

  const effectiveWidth = collapsed ? collapsedWidth : width;

  const clamp = (w: number) => Math.max(minWidth, Math.min(maxWidth, w));

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startWidth: width };
  };

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { startX, startWidth } = dragRef.current;
      const delta = e.clientX - startX;
      const next = side === "left"
        ? startWidth + delta
        : startWidth - delta;
      const clamped = clamp(next);
      setWidth(clamped);
      onResize?.(clamped);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, side, onResize]);

  const handleDoubleClick = () => {
    setWidth(defaultWidth);
    onResize?.(defaultWidth);
  };

  return (
    <div
      ref={panelRef}
      style={{
        width: effectiveWidth,
        minWidth: effectiveWidth,
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
        transition: isDragging ? "none" : "width 0.2s ease",
        userSelect: isDragging ? "none" : undefined,
      }}
    >
      {children}

      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          [side === "left" ? "right" : "left"]: 0,
          width: 4,
          cursor: "col-resize",
          zIndex: 10,
          backgroundColor: "transparent",
          transition: "background-color 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--proof-blue-border)";
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
      />
    </div>
  );
}
