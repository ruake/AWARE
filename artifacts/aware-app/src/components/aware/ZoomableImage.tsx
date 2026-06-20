import React from "react";
import { Loader2, AlertCircle, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

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
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStart = React.useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const lastPinchDist = React.useRef(0);

  const resetView = React.useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Update bounds to prevent panning out of view
  const clampPan = (newPan: { x: number; y: number }, currentZoom: number) => {
    if (!containerRef.current || currentZoom <= 1) return { x: 0, y: 0 };

    const rect = containerRef.current.getBoundingClientRect();
    const maxX = (rect.width * (currentZoom - 1)) / 2;
    const maxY = (rect.height * (currentZoom - 1)) / 2;

    return {
      x: Math.max(-maxX, Math.min(maxX, newPan.x)),
      y: Math.max(-maxY, Math.min(maxY, newPan.y)),
    };
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => {
      const newZoom = Math.max(1, Math.min(10, z * delta));
      if (newZoom === 1) setPan({ x: 0, y: 0 });
      return newZoom;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan(clampPan({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy }, zoom));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging || error || loading) return;
    if (zoom > 1) {
      resetView();
    } else {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width;
      const cy = (e.clientY - rect.top) / rect.height;
      setZoom(2.5);
      setPan(
        clampPan(
          {
            x: -(cx - 0.5) * rect.width * 1.5,
            y: -(cy - 0.5) * rect.height * 1.5,
          },
          2.5,
        ),
      );
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
      setZoom((z) => {
        const newZoom = Math.max(1, Math.min(10, z * delta));
        if (newZoom === 1) setPan({ x: 0, y: 0 });
        return newZoom;
      });
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
        cursor: loading ? "wait" : error ? "default" : zoom > 1 ? "grab" : "zoom-in",
        maxHeight,
        width: "100%",
        backgroundColor: "var(--proof-surface-2)",
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
      {loading && !error && (
        <div
          style={{
            position: "absolute",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Loader2 className="animate-spin text-proof-blue" size={32} />
          <span style={{ fontSize: 12, color: "var(--proof-text-secondary)" }}>
            Loading Image...
          </span>
        </div>
      )}

      {error && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            padding: 40,
            color: "var(--proof-red)",
          }}
        >
          <AlertCircle size={40} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Failed to load image</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>The image could not be retrieved</div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setError(false);
              setLoading(true);
            }}
            className="proof-button proof-button-sm"
          >
            Retry
          </button>
        </div>
      )}

      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        style={{
          display: loading || error ? "none" : "block",
          maxWidth: "100%",
          maxHeight,
          borderRadius: 4,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transition: isDragging ? "none" : "transform 0.1s ease-out",
          transformOrigin: "center center",
          pointerEvents: "none",
        }}
      />

      {!loading && !error && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            zIndex: 10,
          }}
        >
          {zoom !== 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetView();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                backdropFilter: "blur(4px)",
              }}
              title="Reset Zoom"
            >
              <RotateCcw size={14} />
            </button>
          )}
          <div
            style={{
              height: 28,
              padding: "0 10px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              color: "#fff",
              background: "rgba(0,0,0,0.6)",
              borderRadius: 14,
              backdropFilter: "blur(4px)",
              pointerEvents: "none",
            }}
          >
            {zoom > 1 ? <ZoomIn size={12} /> : <ZoomOut size={12} />}
            {Math.round(zoom * 100)}%
          </div>
        </div>
      )}
    </div>
  );
}
