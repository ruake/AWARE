import React from "react";

export function useAccessibility(options: {
  label: string;
  description?: string;
  role?: string;
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}): Record<string, any> {
  const id = React.useId();
  const describedById = options.description ? `${id}-desc` : undefined;

  const props: Record<string, any> = {
    "aria-label": options.label,
    role: options.role ?? "region",
    tabIndex: options.tabIndex ?? 0,
  };

  if (options.description) {
    props["aria-describedby"] = describedById;
  }

  if (options.onKeyDown) {
    props.onKeyDown = options.onKeyDown;
  }

  return props;
}

export function useKeyboardNavigation(
  handlers: Record<string, (e: KeyboardEvent) => void>,
): void {
  const stableHandlers = React.useRef(handlers);
  stableHandlers.current = handlers;

  React.useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      const key = e.key;
      const combo = e.ctrlKey || e.metaKey ? `Ctrl+${key}` : key;
      const handler = stableHandlers.current[key] ?? stableHandlers.current[combo];
      if (handler) {
        handler(e);
      }
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, []);
}

export function AriaButton(props: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
  hidden?: boolean;
  style?: React.CSSProperties;
}): React.ReactElement {
  return (
    <button
      onClick={props.onClick}
      aria-label={props.label}
      role="button"
      tabIndex={props.hidden ? -1 : 0}
      disabled={props.disabled}
      aria-disabled={props.disabled}
      aria-hidden={props.hidden}
      hidden={props.hidden}
      style={props.style}
    >
      {props.children}
    </button>
  );
}

export function AriaRegion(props: {
  children: React.ReactNode;
  politeness?: "off" | "polite" | "assertive";
}): React.ReactElement {
  return (
    <div
      aria-live={props.politeness ?? "polite"}
      aria-atomic="true"
      role="status"
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0,
      }}
    >
      {props.children}
    </div>
  );
}

export function SrOnly(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0,
      }}
    >
      {props.children}
    </span>
  );
}

let announcerEl: HTMLDivElement | null = null;

function getAnnouncer(): HTMLDivElement {
  if (!announcerEl) {
    announcerEl = document.createElement("div");
    announcerEl.setAttribute("aria-live", "polite");
    announcerEl.setAttribute("aria-atomic", "true");
    announcerEl.setAttribute("role", "status");
    Object.assign(announcerEl.style, {
      position: "absolute",
      width: "1px",
      height: "1px",
      padding: "0",
      margin: "-1px",
      overflow: "hidden",
      clip: "rect(0, 0, 0, 0)",
      whiteSpace: "nowrap",
      border: "0",
    });
    document.body.appendChild(announcerEl);
  }
  return announcerEl;
}

export function announceToScreenReader(
  message: string,
  politeness: "off" | "polite" | "assertive" = "polite",
): void {
  const el = getAnnouncer();
  el.setAttribute("aria-live", politeness);
  el.textContent = "";
  requestAnimationFrame(() => {
    el.textContent = message;
  });
}

export function useFocusTrap(
  ref: React.RefObject<HTMLElement | null>,
  active: boolean,
): void {
  React.useEffect(() => {
    if (!active || !ref.current) return;

    const container = ref.current;
    const focusableSelector =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const getFocusableElements = (): HTMLElement[] => {
      if (!container) return [];
      return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const elements = getFocusableElements();
      if (elements.length === 0) return;

      const firstEl = elements[0];
      const lastEl = elements[elements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const savedFocus = document.activeElement as HTMLElement | null;
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[0].focus();
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (savedFocus && savedFocus.focus) {
        savedFocus.focus();
      }
    };
  }, [ref, active]);
}

export default function AccessibilityWrapper({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <>{children}</>;
}
