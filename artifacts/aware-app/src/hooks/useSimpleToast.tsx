import React from "react";

export function useSimpleToast(timeoutMs = 2500) {
  const [msg, setMsg] = React.useState<string | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  const show = (m: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMsg(m);
    timerRef.current = setTimeout(() => setMsg(null), timeoutMs);
  };
  const Toast = msg ? (
    <div className="gcp-toast">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gcp-green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      {msg}
    </div>
  ) : null;
  return { show, Toast };
}
