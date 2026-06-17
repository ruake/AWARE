import React from "react";

interface ZoomableImageProps {
  src: string;
  alt?: string;
  maxHeight?: string;
}

export function ZoomableImage({ src, alt = "", maxHeight = "70vh" }: ZoomableImageProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const isDragging = React.useRef(false);
  const dragStart = React.useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const lastPinchDist = React.useRef(0);

  const resetView = React.useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(0.5, Math.min(5, z * delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging.current) return;
    if (zoom > 1) {
      resetView();
    } else {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width;
      const cy = (e.clientY - rect.top) / rect.height;
      setZoom(2);
      setPan({
        x: -(cx - 0.5) * rect.width,
        y: -(cy - 0.5) * rect.height,
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      lastPinchDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      const delta = dist / (lastPinchDist.current || dist);
      lastPinchDist.current = dist;
      setZoom((z) => Math.max(0.5, Math.min(5, z * delta)));
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    resetView();
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        cursor: zoom > 1 ? "grab" : "zoom-in",
        maxHeight,
        borderRadius: 4,
        userSelect: "none",
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        style={{
          display: "block",
          maxWidth: "100%",
          maxHeight,
          borderRadius: 4,
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transition: isDragging.current ? "none" : "transform 0.15s ease",
          transformOrigin: "center center",
          pointerEvents: "none",
        }}
      />
      {zoom !== 1 && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            right: 8,
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            color: "#fff",
            background: "rgba(0,0,0,0.5)",
            padding: "2px 6px",
            borderRadius: 3,
            backdropFilter: "blur(4px)",
            pointerEvents: "none",
          }}
        >
          {Math.round(zoom * 100)}%
        </div>
      )}
    </div>
  );
}
