import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { createRoot, type Root } from "react-dom/client";

vi.mock("wouter", () => ({
  useLocation: () => ["/", vi.fn()],
}));

import { useSyncedUrlState } from "../urlState";

function TestComponent({
  testKey,
  defaultValue,
  onRender,
}: {
  testKey: string;
  defaultValue: unknown;
  onRender: (state: unknown, setState: (val: unknown) => void) => void;
}) {
  const [state, setState] = useSyncedUrlState(testKey, defaultValue);
  React.useEffect(() => {
    onRender(state, setState);
  }, [state, setState, onRender]);
  return null;
}

function waitForReact() {
  return new Promise((resolve) => setTimeout(resolve, 50));
}

describe("useSyncedUrlState", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    if (root) {
      root.unmount();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.restoreAllMocks();
  });

  it("returns default value when URL has no matching params", async () => {
    const onRender = vi.fn();
    root = createRoot(container);
    await React.act(async () => {
      root.render(
        React.createElement(TestComponent, {
          testKey: "foo",
          defaultValue: "default",
          onRender,
        }),
      );
    });

    await waitForReact();
    const firstCall = onRender.mock.calls[0];
    expect(firstCall).toBeDefined();
    expect(firstCall[0]).toBe("default");
  });

  it("reads string param from URL", async () => {
    window.history.replaceState({}, "", "/?filter=active");

    const onRender = vi.fn();
    root = createRoot(container);
    await React.act(async () => {
      root.render(
        React.createElement(TestComponent, {
          testKey: "filter",
          defaultValue: "all",
          onRender,
        }),
      );
    });

    await waitForReact();
    const firstCall = onRender.mock.calls[0];
    expect(firstCall).toBeDefined();
    expect(firstCall[0]).toBe("active");
  });

  it("reads JSON array param from URL", async () => {
    window.history.replaceState({}, "", "/?ids=%5B1%2C2%2C3%5D");
    const onRender = vi.fn();
    root = createRoot(container);
    await React.act(async () => {
      root.render(
        React.createElement(TestComponent, {
          testKey: "ids",
          defaultValue: [],
          onRender,
        }),
      );
    });

    await waitForReact();
    const firstCall = onRender.mock.calls[0];
    expect(firstCall).toBeDefined();
    expect(firstCall[0]).toEqual([1, 2, 3]);
  });

  it("treats empty array as default and removes from URL", async () => {
    const onRender = vi.fn();
    root = createRoot(container);
    await React.act(async () => {
      root.render(
        React.createElement(TestComponent, {
          testKey: "items",
          defaultValue: [] as string[],
          onRender,
        }),
      );
    });

    await waitForReact();
    const firstCall = onRender.mock.calls[0];
    expect(firstCall).toBeDefined();
    expect(firstCall[0]).toEqual([]);

    const setState = firstCall[1];
    await React.act(async () => {
      setState([]);
    });

    expect(window.location.search).not.toContain("items=");
  });

  it("writes non-default values to URL", async () => {
    const onRender = vi.fn();
    root = createRoot(container);
    await React.act(async () => {
      root.render(
        React.createElement(TestComponent, {
          testKey: "view",
          defaultValue: "list",
          onRender,
        }),
      );
    });

    await waitForReact();
    const firstCall = onRender.mock.calls[0];
    const setState = firstCall[1];

    await React.act(async () => {
      setState("grid");
    });

    await waitForReact();
    expect(window.location.search).toContain("view=grid");
  });
});
