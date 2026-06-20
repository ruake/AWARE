import React from "react";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";
import type { FilmstripFrame } from "@/lib/types";
import { getImageSource, preloadImage } from "@/lib/data";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ZoomableImage } from "@/components/aware/ZoomableImage";

function LazyGalleryImage({ source }: { source: string }) {
  const [url, setUrl] = React.useState("");
  React.useEffect(() => {
    preloadImage(source).then(setUrl);
  }, [source]);
  if (!url) {
    return (
      <div
        style={{
          width: 400,
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          color: "var(--proof-text-secondary)",
        }}
      >
        Loading…
      </div>
    );
  }
  return <ZoomableImage src={url} alt="" />;
}

function GalleryImage({
  frame,
  onPrev,
  onNext,
}: {
  frame: FilmstripFrame;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
}) {
  const source = getImageSource(frame);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && onPrev) {
        onPrev();
        e.preventDefault();
      }
      if (e.key === "ArrowRight" && onNext) {
        onNext();
        e.preventDefault();
      }
      if (e.key === "Escape") {
        /* handled by Dialog */
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onPrev, onNext]);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        maxHeight: "80vh",
      }}
    >
      {onPrev && (
        <button
          onClick={onPrev}
          style={{
            position: "absolute",
            left: 8,
            top: "50%",
            transform: "translateY(-50%)",
            border: "none",
            background: "rgba(0,0,0,0.5)",
            color: "#fff",
            cursor: "pointer",
            borderRadius: "50%",
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            backdropFilter: "blur(4px)",
          }}
        >
          <ChevronLeft size={18} />
        </button>
      )}
      {source.startsWith("data:") ? (
        <ZoomableImage src={source} alt={frame.label} />
      ) : (
        <LazyGalleryImage source={source} />
      )}
      {onNext && (
        <button
          onClick={onNext}
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            border: "none",
            background: "rgba(0,0,0,0.5)",
            color: "#fff",
            cursor: "pointer",
            borderRadius: "50%",
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            backdropFilter: "blur(4px)",
          }}
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}

function FilmstripThumbnail({
  frame,
  isActive,
  onExpand,
}: {
  frame: FilmstripFrame;
  isActive: boolean;
  onExpand: () => void;
}) {
  const isDataUri = React.useMemo(() => getImageSource(frame).startsWith("data:"), [frame]);
  const [src, setSrc] = React.useState<string>(() => getImageSource(frame));
  const [loaded, setLoaded] = React.useState(isDataUri);

  React.useEffect(() => {
    const source = getImageSource(frame);
    if (!source.startsWith("data:")) {
      preloadImage(source).then((url) => {
        setSrc(url);
        setLoaded(true);
      });
    }
  }, [frame, frame.dataUri, frame.imageUrl]);

  return (
    <div style={{ flexShrink: 0, width: 140 }}>
      <button
        onClick={onExpand}
        style={{
          padding: 0,
          border: "none",
          background: "none",
          cursor: "pointer",
          display: "block",
          width: "100%",
        }}
      >
        {loaded ? (
          <img
            src={src}
            alt={frame.label}
            loading="lazy"
            style={{
              width: "100%",
              borderRadius: 4,
              border: isActive ? "2px solid var(--proof-blue)" : "1px solid var(--proof-grey)",
              display: "block",
              boxShadow: isActive ? "0 0 0 2px var(--proof-blue-bg)" : undefined,
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: 80,
              borderRadius: 4,
              border: "1px solid var(--proof-grey)",
              background: "var(--proof-grey-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              color: "var(--proof-text-secondary)",
            }}
          >
            Loading…
          </div>
        )}
      </button>
      <div
        style={{
          fontSize: 9,
          color: isActive ? "var(--proof-blue)" : "var(--proof-text-secondary)",
          marginTop: 2,
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          fontWeight: isActive ? 600 : 400,
        }}
      >
        {frame.label}
        <Maximize2 size={9} />
      </div>
    </div>
  );
}

export function FilmstripViewer({ frames, onClose }: { frames: FilmstripFrame[]; onClose: () => void }) {
  const [activeIdx, setActiveIdx] = React.useState<number | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStart = React.useRef({ x: 0, scrollLeft: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, scrollLeft: scrollRef.current.scrollLeft };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const dx = e.clientX - dragStart.current.x;
    scrollRef.current.scrollLeft = dragStart.current.scrollLeft - dx;
  };

  const handleMouseUp = () => setIsDragging(false);

  const scrollTo = (dir: -1 | 1) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 160, behavior: "smooth" });
  };

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        el.scrollBy({ left: -160, behavior: "smooth" });
        e.preventDefault();
      }
      if (e.key === "ArrowRight") {
        el.scrollBy({ left: 160, behavior: "smooth" });
        e.preventDefault();
      }
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, []);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "var(--proof-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            flex: 1,
          }}
        >
          Filmstrip ({frames.length})
        </span>
        <button
          onClick={() => scrollTo(-1)}
          style={{
            border: "none",
            background: "var(--proof-surface-hover)",
            cursor: "pointer",
            padding: "2px 6px",
            borderRadius: 3,
            color: "var(--proof-text-secondary)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ChevronLeft size={11} />
        </button>
        <button
          onClick={() => scrollTo(1)}
          style={{
            border: "none",
            background: "var(--proof-surface-hover)",
            cursor: "pointer",
            padding: "2px 6px",
            borderRadius: 3,
            color: "var(--proof-text-secondary)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ChevronRight size={11} />
        </button>
      </div>
      <div
        ref={scrollRef}
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 4,
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
          scrollBehavior: "smooth",
          outline: "none",
        }}
      >
        {frames.map((f, i) => (
          <FilmstripThumbnail
            key={f.id}
            frame={f}
            isActive={activeIdx === i}
            onExpand={() => setActiveIdx(i)}
          />
        ))}
      </div>

      {/* Lightbox gallery */}
      <Dialog
        open={activeIdx !== null}
        onOpenChange={(open) => {
          if (!open) setActiveIdx(null);
        }}
      >
        <DialogContent
          style={{
            maxWidth: "95vw",
            width: "auto",
            background: "var(--proof-surface)",
            border: "1px solid var(--proof-grey)",
            padding: 0,
            overflow: "hidden",
          }}
        >
          {activeIdx !== null && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderBottom: "1px solid var(--proof-grey)",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--proof-text-secondary)",
                    fontFamily: "var(--font-mono)",
                    flex: 1,
                  }}
                >
                  {frames[activeIdx].label}
                </span>
                <span style={{ fontSize: 10, color: "var(--proof-text-muted)" }}>
                  {activeIdx + 1} / {frames.length}
                </span>
                <button
                  onClick={onClose}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "var(--proof-text-secondary)",
                    display: "flex",
                  }}
                >
                  <X size={14} />
                </button>
              </div>
              <GalleryImage
                frame={frames[activeIdx]}
                onPrev={activeIdx > 0 ? () => setActiveIdx(activeIdx - 1) : null}
                onNext={activeIdx < frames.length - 1 ? () => setActiveIdx(activeIdx + 1) : null}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
