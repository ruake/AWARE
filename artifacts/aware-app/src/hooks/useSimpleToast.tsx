import React from "react";

interface ToastAction {
  label: string;
  onClick: () => void;
}

export function useSimpleToast(timeoutMs = 5000) {
  const [state, setState] = React.useState<{ msg: string; action?: ToastAction } | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );
  const show = (m: string, action?: ToastAction) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState({ msg: m, action });
    timerRef.current = setTimeout(() => setState(null), timeoutMs);
  };
  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState(null);
  };
  const Toast = state ? (
    <div className="proof-toast">
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--proof-green)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {state.msg}
      {state.action && (
        <button
          onClick={() => {
            state.action!.onClick();
            dismiss();
          }}
          className="proof-button proof-button-xs"
          style={{ color: "var(--proof-blue)", borderColor: "var(--proof-blue)" }}
        >
          {state.action.label}
        </button>
      )}
    </div>
  ) : null;
  return { show, Toast, dismiss };
}
