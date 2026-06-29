import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { preloadImage } from "@/lib/images";
import { ImageIcon, AlertCircle } from "lucide-react";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  aspectRatio?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  aspectRatio,
  alt = "",
  style,
  className,
  onLoad,
  onError,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observerRef.current?.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    if (containerRef.current) {
      observerRef.current.observe(containerRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isVisible || !src) return;

    let mounted = true;

    const loadImage = async () => {
      try {
        const url = await preloadImage(src);
        if (mounted) {
          setBlobUrl(url);
        }
      } catch {
        if (mounted) {
          setError(true);
          onError?.();
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [isVisible, src, onError]);

  const handleImgLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  const handleImgError = () => {
    setError(true);
    onError?.();
  };

  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    paddingBottom: aspectRatio ? `${(1 / aspectRatio) * 100}%` : undefined,
    height: aspectRatio ? 0 : "100%",
    overflow: "hidden",
    borderRadius: "inherit",
    ...style,
  };

  return (
    <div ref={containerRef} style={containerStyle} className={`${className || ""} glass-panel`}>
      {!loaded && !error && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div className="animate-shimmer" style={{ position: "absolute", inset: 0, opacity: 0.1 }} />
          <div style={{ position: "absolute", zIndex: 1 }}>
            <motion.div
              initial={{ opacity: 0.2 }}
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ImageIcon size={28} style={{ color: "var(--proof-blue)", opacity: 0.5, filter: "drop-shadow(var(--proof-glow-cyan))" }} />
            </motion.div>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: "var(--proof-red)",
            background: "rgba(255,51,85,0.1)",
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          <AlertCircle size={20} />
          <span>Failed to load</span>
        </div>
      )}

      {isVisible && blobUrl && !error && (
        <img
          src={blobUrl}
          alt={alt}
          onLoad={handleImgLoad}
          onError={handleImgError}
          style={{
            position: aspectRatio ? "absolute" : "relative",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          {...props}
        />
      )}
    </div>
  );
};
