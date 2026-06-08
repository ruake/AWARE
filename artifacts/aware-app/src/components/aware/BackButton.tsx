import React from "react";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  href?: string;
  children?: React.ReactNode;
}

export function BackButton({ href, children }: BackButtonProps) {
  const handleClick = () => {
    if (href) {
      window.location.href = href;
    } else {
      window.history.back();
    }
  };

  return (
    <button onClick={handleClick} className="gcp-button gcp-button-sm">
      <ArrowLeft size={13} /> {children ?? "Back"}
    </button>
  );
}
