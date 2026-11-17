// Shared theme helpers: the saved choice lives in localStorage under "tb.theme",
// and the active theme is a class on <html> so every page (reader, privacy, 404)
// picks up the same colours.
export const THEME_LS_KEY = "tb.theme";

export const THEME_KEYS = ["light", "sepia", "paper", "forest", "dark", "midnight"] as const;
export type ThemeKey = (typeof THEME_KEYS)[number];

const THEME_CLASSES = [
  "theme-sepia",
  "theme-paper",
  "theme-forest",
  "theme-dark",
  "theme-midnight",
];

export function readStoredTheme(): ThemeKey {
  if (typeof window === "undefined") return "light";
  let v: string | null = null;
  try {
    v = localStorage.getItem(THEME_LS_KEY);
  } catch {
    return "light";
  }
  return THEME_KEYS.some((k) => k === v) ? (v as ThemeKey) : "light";
}

export function applyThemeClass(t: ThemeKey) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.classList.remove(...THEME_CLASSES);
  if (t !== "light") el.classList.add(`theme-${t}`);
}
