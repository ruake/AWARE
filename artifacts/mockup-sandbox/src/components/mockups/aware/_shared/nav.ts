const repo = "https://github.com/ruake/AWARE";
const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export function navTo(path: string) {
  const url = `${base}/preview/aware/${path}`;
  history.pushState({ path }, "", url);
  window.dispatchEvent(new PopStateEvent("popstate", { state: { path } }));
}

export function closePanel(name: string) {
  (window as any).__closePanel?.(name);
}

export function showToast(msg: string) {
  (window as any).__showToast?.(msg);
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

export { repo };
