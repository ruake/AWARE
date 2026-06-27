import { create } from "zustand";

interface ThemeState {
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;
}

export const useTheme = create<ThemeState>((set) => ({
  theme: (localStorage.getItem("aware-theme") as "dark" | "light") || "dark",
  setTheme: (theme) => {
    localStorage.setItem("aware-theme", theme);
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    set({ theme });
  },
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === "dark" ? "light" : "dark";
    localStorage.setItem("aware-theme", newTheme);
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(newTheme);
    return { theme: newTheme };
  }),
}));
