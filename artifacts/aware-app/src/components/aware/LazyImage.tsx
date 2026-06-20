import React, { useState, useEffect, useRef } from "react";
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
      { rootMargin: "200px" }
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

  // Handle cleanup of blob URLs if they were created specifically for this component instance
  // Note: images.ts handles the actual LRU cache, but we want to ensure we don't leak if the cache is cleared
  // Actually, images.ts should be the source of truth for revocation.

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
    backgroundColor: "var(--proof-surface-2)",
    overflow: "hidden",
    borderRadius: "inherit",
    ...style,
  };

  return (
    <div ref={containerRef} style={containerStyle} className={className}>
      {!loaded && !error && (
        <div
          className="proof-skeleton"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ImageIcon size={20} style={{ color: "var(--proof-text-muted)", opacity: 0.2 }} />
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
            background: "var(--proof-red-bg)",
            fontSize: 10,
          }}
        >
          <AlertCircle size={16} />
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
            transition: "opacity 0.3s ease-in-out",
          }}
          {...props}
        />
      )}
    </div>
  );
};
