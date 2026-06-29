import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { navTo, copyToClipboard, showToast, repo } from "../nav";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("navTo", () => {
  it("pushes state and dispatches popstate event", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    const dispatchEvent = vi.spyOn(window, "dispatchEvent");

    navTo("/test-path");

    expect(pushState).toHaveBeenCalledWith(null, "", "/test-path");
    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "popstate",
      }),
    );
  });

  it("prepends / when path does not start with /", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    navTo("relative-path");
    expect(pushState).toHaveBeenCalledWith(null, "", "/relative-path");
  });

  it("blocks empty path (open-redirect guard)", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    navTo("");
    expect(pushState).not.toHaveBeenCalled();
  });

  it("blocks protocol-relative URLs (open-redirect guard)", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    navTo("//evil.com");
    expect(pushState).not.toHaveBeenCalled();
  });

  it("blocks absolute http URLs (open-redirect guard)", () => {
    const pushState = vi.spyOn(window.history, "pushState");
    navTo("https://evil.com/phish");
    expect(pushState).not.toHaveBeenCalled();
  });
});

describe("copyToClipboard", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("uses navigator.clipboard when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
      writable: true,
    });

    copyToClipboard("hello world");
    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("hello world");
    });
  });

  it("falls back to execCommand when clipboard API fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("clipboard error"));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
      writable: true,
    });

    const execCommand = vi.fn().mockReturnValue(true);
    document.execCommand = execCommand;

    copyToClipboard("fallback text");
    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalled();
      expect(execCommand).toHaveBeenCalledWith("copy");
    });
  });

  it("uses execCommand when clipboard API is not available", () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const execCommand = vi.fn().mockReturnValue(true);
    document.execCommand = execCommand;

    const createElementSpy = vi.spyOn(document, "createElement");

    copyToClipboard("no clipboard api");

    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(createElementSpy).toHaveBeenCalledWith("textarea");
  });
});

describe("showToast", () => {
  it("calls window.__showToast when set", () => {
    const toastFn = vi.fn();
    (window as any).__showToast = toastFn;

    showToast("test message");
    expect(toastFn).toHaveBeenCalledWith("test message");
  });

  it("does nothing when __showToast is not set", () => {
    delete (window as any).__showToast;
    expect(() => showToast("msg")).not.toThrow();
  });
});

describe("repo", () => {
  it("exports the repo URL", () => {
    expect(repo).toBe("https://github.com/ruake/AWARE");
  });
});
