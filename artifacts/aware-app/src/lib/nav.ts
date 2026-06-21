/**
 * SPA navigation using the History API.
 * Pushes state and dispatches a popstate event so wouter picks up the change
 * without a full page reload (which would destroy React state).
 */
export function navTo(path: string) {
  if (!path || /^(?:https?:|\/\/)/i.test(path)) return;
  const resolved = path.startsWith("/") ? path : `/${path}`;
  window.history.pushState(null, "", resolved);
  window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
}

export function copyToClipboard(text: string) {
  const fallback = () => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(fallback);
  } else {
    fallback();
  }
}

export function showToast(msg: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__showToast?.(msg);
}

export const repo = "https://github.com/ruake/AWARE";
