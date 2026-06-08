export function navTo(path: string) {
  window.location.href = path.startsWith("/") ? path : `/${path}`;
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
  (window as any).__showToast?.(msg);
}

export const repo = "https://github.com/ruake/PROOF";
