import { useSyncExternalStore } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import type { ThemeMode } from "@/lib/theme";
import { getTheme, subscribeToTheme, setTheme } from "@/lib/theme";

const CYCLE: ThemeMode[] = ["light", "dark", "system"];

const ICONS: Record<ThemeMode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const LABELS: Record<ThemeMode, string> = {
  light: "Light mode",
  dark: "Dark mode",
  system: "System theme",
};

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToTheme, getTheme);

  const cycle = () => {
    const idx = CYCLE.indexOf(theme);
    const next = CYCLE[(idx + 1) % CYCLE.length];
    setTheme(next);
  };

  const Icon = ICONS[theme];

  return (
    <button
      onClick={cycle}
      title={LABELS[theme]}
      style={{
        width: 28,
        height: 28,
        padding: 0,
        border: "1px solid var(--proof-border)",
        background: "transparent",
        cursor: "pointer",
        color: "var(--proof-text-muted)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--proof-radius-sm)",
        transition: "all 120ms ease",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.color = "var(--proof-text)";
        el.style.background = "var(--proof-hover)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.color = "var(--proof-text-muted)";
        el.style.background = "transparent";
      }}
    >
      <Icon size={12} />
    </button>
  );
}
