import React, { useSyncExternalStore, useCallback, useRef, useEffect } from "react";
import { Bell, BellDot, X, CheckCheck } from "lucide-react";
import {
  getNotifications,
  subscribeToNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  dismiss,
  type AppNotification,
} from "@/lib/notifications";

const TYPE_COLORS: Record<AppNotification["type"], { dot: string; bg: string; border: string }> = {
  promotion: { dot: "var(--proof-green)", bg: "var(--proof-green-bg)", border: "var(--proof-green-border)" },
  failure: { dot: "var(--proof-red)", bg: "var(--proof-red-bg)", border: "var(--proof-red-border)" },
  deploy: { dot: "var(--proof-blue)", bg: "var(--proof-blue-bg)", border: "var(--proof-blue-border)" },
  regression: { dot: "var(--proof-orange)", bg: "var(--proof-orange-bg)", border: "var(--proof-orange-border)" },
  info: { dot: "var(--proof-purple)", bg: "var(--proof-purple-bg)", border: "var(--proof-purple-border)" },
  warning: { dot: "var(--proof-yellow)", bg: "var(--proof-yellow-bg)", border: "var(--proof-yellow-border)" },
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const notifications = useSyncExternalStore(subscribeToNotifications, getNotifications);
  const unread = useSyncExternalStore(subscribeToNotifications, getUnreadCount);

  const recent = notifications.slice(0, 10);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleMarkAllRead = useCallback(() => {
    markAllRead();
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen((p) => !p)}
        title="Notifications"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        style={{
          width: 28,
          height: 28,
          padding: 0,
          border: "1px solid var(--proof-border)",
          background: open ? "var(--proof-hover)" : "transparent",
          cursor: "pointer",
          color: unread > 0 ? "var(--proof-blue-bright)" : "var(--proof-text-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--proof-radius-sm)",
          transition: "all 120ms ease",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.color = "var(--proof-text)";
          el.style.background = "var(--proof-hover)";
        }}
        onMouseLeave={(e) => {
          if (!open) {
            const el = e.currentTarget as HTMLElement;
            el.style.color = unread > 0 ? "var(--proof-blue-bright)" : "var(--proof-text-muted)";
            el.style.background = "transparent";
          }
        }}
      >
        {unread > 0 ? <BellDot size={14} /> : <Bell size={14} />}
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "var(--proof-red-bright)",
              color: "white",
              fontSize: 8,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              boxShadow: "0 0 6px var(--proof-red-glow)",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 360,
            maxHeight: 480,
            background: "var(--proof-surface)",
            border: "1px solid var(--proof-border-strong)",
            borderRadius: "var(--proof-radius-lg)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              borderBottom: "1px solid var(--proof-border)",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text)", letterSpacing: "0.02em" }}>
              NOTIFICATIONS
            </span>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 8px",
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid var(--proof-border)",
                  borderRadius: "var(--proof-radius-sm)",
                  background: "transparent",
                  color: "var(--proof-text-secondary)",
                  transition: "all 120ms ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = "var(--proof-text)";
                  el.style.borderColor = "var(--proof-blue-border)";
                  el.style.background = "var(--proof-blue-bg)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = "var(--proof-text-secondary)";
                  el.style.borderColor = "var(--proof-border)";
                  el.style.background = "transparent";
                }}
              >
                <CheckCheck size={11} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {recent.length === 0 ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  fontSize: 12,
                  color: "var(--proof-text-muted)",
                }}
              >
                No notifications
              </div>
            ) : (
              recent.map((n) => {
                const colors = TYPE_COLORS[n.type];
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      markRead(n.id);
                    }}
                    style={{
                      display: "flex",
                      gap: 10,
                      padding: "10px 14px",
                      cursor: "pointer",
                      borderBottom: "1px solid var(--proof-border-light)",
                      background: n.read ? "transparent" : colors.bg,
                      transition: "background 120ms ease",
                      alignItems: "flex-start",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "var(--proof-surface-hover)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = n.read ? "transparent" : colors.bg;
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: colors.dot,
                        marginTop: 4,
                        flexShrink: 0,
                        boxShadow: `0 0 6px ${colors.dot}`,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 2,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "var(--proof-text)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {n.title}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            color: "var(--proof-text-muted)",
                            whiteSpace: "nowrap",
                            marginLeft: "auto",
                          }}
                        >
                          {timeAgo(n.timestamp)}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 11,
                          color: "var(--proof-text-secondary)",
                          lineHeight: 1.4,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {n.message}
                      </p>
                      {(n.actionable || n.link) && (
                        <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                          {n.link && (
                            <a
                              href={n.link}
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: "var(--proof-blue-bright)",
                                textDecoration: "none",
                              }}
                            >
                              {n.actionLabel || "View details"}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismiss(n.id);
                      }}
                      title="Dismiss"
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--proof-text-muted)",
                        padding: 2,
                        display: "flex",
                        opacity: 0,
                        transition: "opacity 120ms ease",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.opacity = "1";
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 10 && (
            <div
              style={{
                padding: "8px 14px",
                borderTop: "1px solid var(--proof-border)",
                textAlign: "center",
                fontSize: 10,
                color: "var(--proof-text-muted)",
              }}
            >
              {notifications.length - 10} more notification{notifications.length - 10 !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
