import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { createRoot, type Root } from "react-dom/client";

vi.mock("wouter", () => ({
  useLocation: () => ["/", vi.fn()],
}));

import { useSyncedUrlState } from "../../lib/urlState";

function TestComponent({
  testKey,
  defaultValue,
  onRender,
  onSet,
}: {
  testKey: string;
  defaultValue: unknown;
  onRender: (state: unknown, setState: (val: unknown) => void) => void;
  onSet?: (setState: (val: unknown) => void) => void;
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

describe("useSyncedUrlState (hooks)", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    window.history.replaceState({}, "", "/");
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (root) {
      root.unmount();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it("returns default value when param is absent", async () => {
    const onRender = vi.fn();
    root = createRoot(container);
    await React.act(async () => {
      root.render(
        React.createElement(TestComponent, {
          testKey: "mode",
          defaultValue: "default-mode",
          onRender,
        }),
      );
    });

    await waitForReact();
    const call = onRender.mock.calls[0];
    expect(call[0]).toBe("default-mode");
  });

  it("reads URL param when present in query string", async () => {
    window.history.replaceState({}, "", "/?mode=advanced");

    const onRender = vi.fn();
    root = createRoot(container);
    await React.act(async () => {
      root.render(
        React.createElement(TestComponent, {
          testKey: "mode",
          defaultValue: "basic",
          onRender,
        }),
      );
    });

    await waitForReact();
    const call = onRender.mock.calls[0];
    expect(call[0]).toBe("advanced");
  });

  it("reads JSON-valued URL params", async () => {
    window.history.replaceState({}, "", "/?config=%7B%22theme%22%3A%22dark%22%7D");

    const onRender = vi.fn();
    root = createRoot(container);
    await React.act(async () => {
      root.render(
        React.createElement(TestComponent, {
          testKey: "config",
          defaultValue: {},
          onRender,
        }),
      );
    });

    await waitForReact();
    const call = onRender.mock.calls[0];
    expect(call[0]).toEqual({ theme: "dark" });
  });

  it("updates URL when setState is called with a new value", async () => {
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

  it("removes param from URL when value matches default", async () => {
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
      setState("list");
    });
    await waitForReact();

    expect(window.location.search).not.toContain("view=");
  });

  it("removes param from URL when empty string is the value", async () => {
    const onRender = vi.fn();
    root = createRoot(container);
    await React.act(async () => {
      root.render(
        React.createElement(TestComponent, {
          testKey: "q",
          defaultValue: "",
          onRender,
        }),
      );
    });

    await waitForReact();
    const firstCall = onRender.mock.calls[0];
    const setState = firstCall[1];

    await React.act(async () => {
      setState("search");
    });
    await waitForReact();

    expect(window.location.search).toContain("q=search");

    await React.act(async () => {
      setState("");
    });
    await waitForReact();

    expect(window.location.search).not.toContain("q=");
  });

  it("supports function updater pattern", async () => {
    const onRender = vi.fn();
    root = createRoot(container);
    await React.act(async () => {
      root.render(
        React.createElement(TestComponent, {
          testKey: "count",
          defaultValue: 0,
          onRender,
        }),
      );
    });

    await waitForReact();
    const firstCall = onRender.mock.calls[0];
    const setState = firstCall[1];

    await React.act(async () => {
      setState((prev: number) => prev + 1);
    });
    await waitForReact();

    expect(window.location.search).toContain("count=1");
  });

  it("handles multiple state keys independently", async () => {
    const renderA = vi.fn();
    const renderB = vi.fn();

    root = createRoot(container);
    await React.act(async () => {
      root.render(
        React.createElement(
          "div",
          null,
          React.createElement(TestComponent, {
            testKey: "a",
            defaultValue: "1",
            onRender: renderA,
          }),
          React.createElement(TestComponent, {
            testKey: "b",
            defaultValue: "x",
            onRender: renderB,
          }),
        ),
      );
    });

    await waitForReact();
    expect(renderA.mock.calls[0][0]).toBe("1");
    expect(renderB.mock.calls[0][0]).toBe("x");
  });
});
