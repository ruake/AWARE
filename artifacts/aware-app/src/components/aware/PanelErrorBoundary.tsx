import React from "react";
import { ErrorBoundary } from "./ErrorBoundary";

interface Props {
  children: React.ReactNode;
  label?: string;
  height?: string;
}

export function PanelErrorBoundary({ children, label, height }: Props) {
  return (
    <ErrorBoundary label={label} variant="panel" height={height}>
      {children}
    </ErrorBoundary>
  );
}
