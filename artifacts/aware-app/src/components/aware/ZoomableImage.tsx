import React from "react";
import { Loader2, AlertCircle, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, ImageOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const dragStart = React.useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const lastPinchDist = React.useRef(0);

  const resetView = React.useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const toggleFullScreen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsFullScreen(!isFullScreen);
    resetView();
  };

  const adjustZoom = (delta: number) => {
    setZoom((z: number) => {
      const newZoom = Math.max(1, Math.min(10, z * delta));
      if (newZoom === 1) setPan({ x: 0, y: 0 });
      return newZoom;
    });
  };

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
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      adjustZoom(delta);
    }
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
      adjustZoom(delta);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    resetView();
  };

  const content = (
    <div
      ref={containerRef}
      style={{
        position: isFullScreen ? "fixed" : "relative",
        inset: isFullScreen ? 0 : "auto",
        zIndex: isFullScreen ? 1000 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        cursor: loading ? "wait" : error ? "help" : zoom > 1 ? "grab" : "zoom-in",
        maxHeight: isFullScreen ? "100vh" : maxHeight,
        width: "100%",
        height: isFullScreen ? "100vh" : "auto",
        backgroundColor: isFullScreen ? "rgba(0,0,0,0.95)" : "var(--proof-surface-2)",
        borderRadius: isFullScreen ? 0 : 8,
        userSelect: "none",
        border: isFullScreen ? "none" : "1px solid var(--proof-border)",
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
      <AnimatePresence>
        {loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Loader2 className="animate-spin" style={{ color: "var(--proof-blue)" }} size={40} />
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--proof-text-secondary)" }}>
              Processing Evidence...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 40,
            color: "var(--proof-red)",
            background: "var(--proof-red-bg)",
            width: "100%",
            height: "100%",
            borderRadius: "inherit",
          }}
        >
          <ImageOff size={48} strokeWidth={1.5} opacity={0.8} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Capture Unavailable</div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>The requested evidence could not be loaded</div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setError(false);
              setLoading(true);
            }}
            className="proof-btn proof-btn-primary"
            style={{ marginTop: 8 }}
          >
            <RotateCcw size={14} />
            Retry Loading
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
          maxHeight: isFullScreen ? "100%" : maxHeight,
          borderRadius: isFullScreen ? 0 : 4,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transition: isDragging ? "none" : "transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)",
          transformOrigin: "center center",
          pointerEvents: "none",
          boxShadow: isFullScreen ? "none" : "0 4px 24px rgba(0,0,0,0.2)",
        }}
      />

      {!loading && !error && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            zIndex: 10,
            padding: "8px 16px",
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(8px)",
            borderRadius: 32,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => adjustZoom(0.8)}
            style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", opacity: zoom > 1 ? 1 : 0.5 }}
            disabled={zoom <= 1}
          >
            <ZoomOut size={18} />
          </button>
          
          <div style={{ color: "white", fontSize: 12, fontWeight: 700, minWidth: 44, textAlign: "center", fontFamily: "var(--font-mono)" }}>
            {Math.round(zoom * 100)}%
          </div>

          <button
            onClick={() => adjustZoom(1.2)}
            style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}
          >
            <ZoomIn size={18} />
          </button>

          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.2)" }} />

          <button
            onClick={resetView}
            style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}
            title="Reset View"
          >
            <RotateCcw size={16} />
          </button>

          <button
            onClick={toggleFullScreen}
            style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}
            title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      )}
    </div>
  );

  return content;
}
