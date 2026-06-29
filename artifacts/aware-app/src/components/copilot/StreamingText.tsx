import React from "react";

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
  speed?: "slow" | "normal" | "fast";
  onComplete?: () => void;
}

const SPEED_MS: Record<string, number> = {
  slow: 50,
  normal: 20,
  fast: 8,
};

export default function StreamingText({
  content,
  isStreaming,
  speed = "normal",
  onComplete,
}: StreamingTextProps) {
  const words = React.useMemo(() => (content ? content.split(/(\s+)/) : []), [content]);
  const [revealedCount, setRevealedCount] = React.useState(() => (isStreaming ? 0 : words.length));
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedRef = React.useRef(false);
  const onCompleteRef = React.useRef(onComplete);
  const speedRef = React.useRef(speed);
  const wordsLengthRef = React.useRef(words.length);

  React.useEffect(() => {
    onCompleteRef.current = onComplete;
    speedRef.current = speed;
    wordsLengthRef.current = words.length;
  }, [onComplete, speed, words.length]);

  React.useEffect(() => {
    if (!isStreaming) {
      if (words.length > 0 && !completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current?.();
      }
      return;
    }
    completedRef.current = false;
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isStreaming, words.length]);

  React.useEffect(() => {
    if (!isStreaming) return;

    if (revealedCount >= words.length) {
      if (!completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current?.();
      }
      return;
    }

    if (timerRef.current !== null) return;

    const ms = SPEED_MS[speedRef.current] ?? 20;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setRevealedCount((prev) => Math.min(prev + 1, wordsLengthRef.current));
    }, ms);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [revealedCount, words.length, isStreaming]);

  const displayCount = !isStreaming ? words.length : revealedCount;
  const visible = words.slice(0, displayCount);
  const isComplete = displayCount >= words.length;

  return (
    <span>
      {visible.map((w, i) => (
        <span
          key={i}
          className={
            i === revealedCount - 1 && isStreaming && revealedCount > 0
              ? "copilot-word-enter"
              : undefined
          }
        >
          {w}
        </span>
      ))}
      {isStreaming && !isComplete && (
        <span
          className="copilot-streaming-cursor"
          style={{
            display: "inline-block",
            width: 2,
            height: "1em",
            background: "var(--proof-blue)",
            borderRadius: 1,
            marginLeft: 1,
            verticalAlign: "text-bottom",
          }}
        />
      )}
      <style>{`
        @keyframes copilotCursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .copilot-streaming-cursor {
          animation: copilotCursorBlink 0.8s step-end infinite;
        }
      `}</style>
    </span>
  );
}
