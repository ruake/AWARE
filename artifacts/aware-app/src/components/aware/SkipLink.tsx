import React from "react";

export function SkipLink() {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById("main-content");
    if (target) {
      target.setAttribute("tabindex", "-1");
      target.focus();
      target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleClick}
      style={{
        position: "absolute",
        top: "-100%",
        left: 0,
        zIndex: 9999,
        padding: "8px 16px",
        background: "var(--proof-blue)",
        color: "#fff",
        fontSize: 14,
        fontWeight: 700,
        borderRadius: "0 0 4px 4px",
        textDecoration: "none",
        transition: "top 0.15s ease",
        outline: "none",
      }}
      onFocus={(e) => { e.currentTarget.style.top = "0"; }}
      onBlur={(e) => { e.currentTarget.style.top = "-100%"; }}
    >
      Skip to main content
    </a>
  );
}
