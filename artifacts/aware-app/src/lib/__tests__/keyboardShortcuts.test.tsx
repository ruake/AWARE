import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKeyboardShortcuts } from "../keyboardShortcuts";

describe("useKeyboardShortcuts", () => {
  const onNavigate = vi.fn();
  const onToggleHelp = vi.fn();
  const onCloseHelp = vi.fn();
  const onNavigateItems = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should toggle help on ? key", () => {
    renderHook(() => useKeyboardShortcuts({ onNavigate, onToggleHelp, onCloseHelp }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }));
    expect(onToggleHelp).toHaveBeenCalledTimes(1);
  });

  it("should close help on Escape", () => {
    renderHook(() => useKeyboardShortcuts({ onNavigate, onToggleHelp, onCloseHelp }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onCloseHelp).toHaveBeenCalledTimes(1);
  });

  it("should navigate to runs on g then r", () => {
    renderHook(() => useKeyboardShortcuts({ onNavigate, onToggleHelp, onCloseHelp }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "r" }));
    expect(onNavigate).toHaveBeenCalledWith("runs");
  });

  it("should navigate to dashboard on g then d", () => {
    renderHook(() => useKeyboardShortcuts({ onNavigate, onToggleHelp, onCloseHelp }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }));
    expect(onNavigate).toHaveBeenCalledWith("dashboard");
  });

  it("should navigate to home on g then h", () => {
    renderHook(() => useKeyboardShortcuts({ onNavigate, onToggleHelp, onCloseHelp }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "h" }));
    expect(onNavigate).toHaveBeenCalledWith("home");
  });

  it("should navigate to compare on g then c", () => {
    renderHook(() => useKeyboardShortcuts({ onNavigate, onToggleHelp, onCloseHelp }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "c" }));
    expect(onNavigate).toHaveBeenCalledWith("compare");
  });

  it("should not navigate when g sequence is not followed by a nav key", () => {
    renderHook(() => useKeyboardShortcuts({ onNavigate, onToggleHelp, onCloseHelp }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "x" }));
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("j key triggers onNavigateItems next", () => {
    renderHook(() =>
      useKeyboardShortcuts({ onNavigate, onToggleHelp, onCloseHelp, onNavigateItems }),
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
    expect(onNavigateItems).toHaveBeenCalledWith("next");
  });

  it("k key triggers onNavigateItems prev", () => {
    renderHook(() =>
      useKeyboardShortcuts({ onNavigate, onToggleHelp, onCloseHelp, onNavigateItems }),
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k" }));
    expect(onNavigateItems).toHaveBeenCalledWith("prev");
  });

  it("should not respond when disabled", () => {
    renderHook(() =>
      useKeyboardShortcuts({
        onNavigate,
        onToggleHelp,
        onCloseHelp,
        onNavigateItems,
        enabled: false,
      }),
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k" }));
    expect(onToggleHelp).not.toHaveBeenCalled();
    expect(onCloseHelp).not.toHaveBeenCalled();
    expect(onNavigateItems).not.toHaveBeenCalled();
  });

  it("should not trigger j/k when editing in input", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    renderHook(() =>
      useKeyboardShortcuts({ onNavigate, onToggleHelp, onCloseHelp, onNavigateItems }),
    );
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "j", bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "k", bubbles: true }));
    expect(onNavigateItems).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it("should clean up event listener on unmount", () => {
    const onToggle = vi.fn();
    const { unmount } = renderHook(() =>
      useKeyboardShortcuts({ onNavigate, onToggleHelp: onToggle, onCloseHelp }),
    );
    unmount();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }));
    expect(onToggle).not.toHaveBeenCalled();
  });
});
