let liveRegion: HTMLDivElement | null = null;

function getLiveRegion(): HTMLDivElement {
  if (!liveRegion) {
    liveRegion = document.createElement("div");
    liveRegion.setAttribute("role", "status");
    liveRegion.setAttribute("aria-live", "polite");
    liveRegion.setAttribute("aria-atomic", "true");
    liveRegion.style.cssText =
      "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0";
    document.body.appendChild(liveRegion);
  }
  return liveRegion;
}

export function announce(message: string, priority: "polite" | "assertive" = "polite"): void {
  const region = getLiveRegion();
  region.setAttribute("aria-live", priority);
  region.textContent = "";
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}
