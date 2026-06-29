import { getNotifications } from "./notifications";

export interface LiveUpdate {
  id: string;
  runId: string;
  message: string;
  type: "info" | "success" | "warning";
  timestamp: number;
}

export interface ToastInfo {
  type: "success" | "warning" | "info";
  message: string;
}

export function useLiveStatus(): {
  updates: LiveUpdate[];
  pendingCount: number;
  currentToast: ToastInfo | null;
  dismissToast: () => void;
  clearCount: () => void;
} {
  const updates = getNotifications() as LiveUpdate[];
  const dismissToast = () => {};
  const clearCount = () => {};

  return { updates, pendingCount: 0, currentToast: null, dismissToast, clearCount };
}
