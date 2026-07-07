import { useCallback, useEffect, useRef } from "react";

export function useFocusTrap(active: boolean = true) {
  const focusTrapRef = useRef<HTMLDivElement>(null);

  const getFocusableElements = useCallback(() => {
    if (!focusTrapRef.current) return [];
    const selectors = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ];
    return Array.from(
      focusTrapRef.current.querySelectorAll<HTMLElement>(selectors.join(", "))
    );
  }, []);

  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = getFocusableElements();
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    const focusable = getFocusableElements();
    if (focusable.length > 0 && !focusable.includes(document.activeElement as HTMLElement)) {
      focusable[0]!.focus();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [active, getFocusableElements]);

  return focusTrapRef;
}
