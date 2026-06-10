import React from "react";
import { getNotifications } from "./notifications";

export interface LiveUpdate {
  id: string;
  message: string;
  type: "info" | "success" | "warning";
  timestamp: number;
}

export function useLiveStatus() {
  const notifs = React.useMemo(() => getNotifications(), []);
  const [updates] = React.useState<LiveUpdate[]>(notifs);
  const [pendingCount] = React.useState(notifs.length);
  const [currentToast] = React.useState<LiveUpdate | null>(null);

  const dismissToast = React.useCallback(() => {}, []);
  const clearCount = React.useCallback(() => [], []);

  return { updates, pendingCount, currentToast, dismissToast, clearCount };
}
