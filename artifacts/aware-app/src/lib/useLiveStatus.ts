import React from "react";

export interface LiveUpdate {
  id: string;
  message: string;
  type: "info" | "success" | "warning";
  timestamp: number;
}

export function useLiveStatus() {
  const [updates] = React.useState<LiveUpdate[]>([]);
  const [pendingCount] = React.useState(0);
  const [currentToast] = React.useState<LiveUpdate | null>(null);

  const dismissToast = React.useCallback(() => {}, []);
  const clearCount = React.useCallback(() => {}, []);

  return { updates, pendingCount, currentToast, dismissToast, clearCount };
}
