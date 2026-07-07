import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, CheckCircle, AlertTriangle, Info, AlertOctagon } from "lucide-react";
import type { AppNotification } from "@/lib/notifications";

interface ToastItem {
  id: string;
  type: AppNotification["type"];
  title: string;
  message: string;
}

type ToastPosition = "top-right" | "bottom-right";

const DEFAULT_DURATION = 5000;

const TYPE_STYLES: Record<AppNotification["type"], { icon: React.ReactNode; border: string; bg: string; color: string }> = {
  promotion: { icon: <CheckCircle size={14} />, border: "var(--proof-green-border)", bg: "var(--proof-green-bg)", color: "var(--proof-green)" },
  failure: { icon: <AlertOctagon size={14} />, border: "var(--proof-red-border)", bg: "var(--proof-red-bg)", color: "var(--proof-red)" },
  deploy: { icon: <Info size={14} />, border: "var(--proof-blue-border)", bg: "var(--proof-blue-bg)", color: "var(--proof-blue-bright)" },
  regression: { icon: <AlertTriangle size={14} />, border: "var(--proof-orange-border)", bg: "var(--proof-orange-bg)", color: "var(--proof-orange)" },
  info: { icon: <Info size={14} />, border: "var(--proof-purple-border)", bg: "var(--proof-purple-bg)", color: "var(--proof-purple-bright)" },
  warning: { icon: <AlertTriangle size={14} />, border: "var(--proof-yellow-border)", bg: "var(--proof-yellow-bg)", color: "var(--proof-yellow)" },
};

let _toastQueue: ToastItem[] = [];
const _toastListeners = new Set<() => void>();

function notifyToastListeners(): void {
  _toastListeners.forEach((fn) => fn());
}

export function enqueueToast(n: AppNotification): void {
  _toastQueue = [..._toastQueue, { id: n.id, type: n.type, title: n.title, message: n.message }];
  notifyToastListeners();
}

export function dismissToast(id: string): void {
  _toastQueue = _toastQueue.filter((t) => t.id !== id);
  notifyToastListeners();
}

export function subscribeToToastQueue(onChange: () => void): () => void {
  _toastListeners.add(onChange);
  return () => {
    _toastListeners.delete(onChange);
  };
}

export function getToastQueue(): ToastItem[] {
  return _toastQueue;
}

interface SingleToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
  position: ToastPosition;
}

function SingleToast({ toast, onDismiss, position }: SingleToastProps) {
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      onDismiss(toast.id);
    }, DEFAULT_DURATION);
  }, [toast.id, onDismiss, clearTimer]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  useEffect(() => {
    if (paused) {
      clearTimer();
    } else {
      startTimer();
    }
  }, [paused, startTimer, clearTimer]);

  const style = TYPE_STYLES[toast.type];
  const isRight = position === "top-right";

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 14px",
        background: "var(--proof-surface)",
        border: `1px solid ${style.border}`,
        borderRadius: "var(--proof-radius-md)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        color: style.color,
        fontSize: 12,
        lineHeight: 1.4,
        minWidth: 280,
        maxWidth: 380,
        animation: "proof-slide-up 0.25s cubic-bezier(0.2,0,0,1) both",
        position: "relative",
      }}
    >
      <div style={{ marginTop: 1, flexShrink: 0 }}>{style.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: "var(--proof-text)", marginBottom: 2, fontSize: 11 }}>
          {toast.title}
        </div>
        <div style={{ color: "var(--proof-text-secondary)" }}>{toast.message}</div>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--proof-text-muted)",
          padding: 2,
          display: "flex",
          flexShrink: 0,
        }}
      >
        <X size={12} />
      </button>
    </div>
  );
}

export interface NotificationToastProps {
  position?: ToastPosition;
}

export function NotificationToast({ position = "top-right" }: NotificationToastProps) {
  const [queue, setQueue] = useState<ToastItem[]>([]);

  useEffect(() => {
    setQueue(getToastQueue());
    const unsub = subscribeToToastQueue(() => {
      setQueue([...getToastQueue()]);
    });
    return unsub;
  }, []);

  const handleDismiss = useCallback((id: string) => {
    dismissToast(id);
  }, []);

  const isRight = position === "top-right";

  return (
    <div
      style={{
        position: "fixed",
        [isRight ? "right" : "left"]: 16,
        top: position === "top-right" ? 60 : undefined,
        bottom: position === "bottom-right" ? 16 : undefined,
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      {queue.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: "auto" }}>
          <SingleToast toast={toast} onDismiss={handleDismiss} position={position} />
        </div>
      ))}
    </div>
  );
}
