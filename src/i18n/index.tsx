import React, { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { dict, type Dict, type Locale } from "./translations";

type ThemeMode = "dark" | "light" | "system";

interface I18nCtx {
  locale: Locale;
  t: Dict;
  setLocale: (l: Locale) => void;
  toggle: () => void;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
  accent: string;
  setAccent: (a: string) => void;
}

const Ctx = createContext<I18nCtx | null>(null);

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const isDark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", isDark);
  root.setAttribute("data-theme-mode", isDark ? "dark" : "light");
}

function applyAccent(color: string) {
  const root = document.documentElement;
  const map: Record<string, { p: string; s: string; g: string }> = {
    cyan:   { p: "#22d3ee", s: "#0891b2", g: "linear-gradient(135deg,#22d3ee,#6366f1)" },
    purple: { p: "#a78bfa", s: "#7c3aed", g: "linear-gradient(135deg,#a78bfa,#ec4899)" },
    pink:   { p: "#f472b6", s: "#db2777", g: "linear-gradient(135deg,#f472b6,#fb7185)" },
    orange: { p: "#fb923c", s: "#ea580c", g: "linear-gradient(135deg,#fb923c,#f59e0b)" },
    green:  { p: "#34d399", s: "#059669", g: "linear-gradient(135deg,#34d399,#10b981)" },
    mono:   { p: "#94a3b8", s: "#64748b", g: "linear-gradient(135deg,#94a3b8,#475569)" },
  };
  const c = map[color] ?? map.cyan;
  root.style.setProperty("--brand-primary", c.p);
  root.style.setProperty("--brand-secondary", c.s);
  root.style.setProperty("--brand-gradient", c.g);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>(() => {
    return (localStorage.getItem("nh.locale") as Locale) || "zh";
  });
  const [theme, setThemeState] = React.useState<ThemeMode>(() => {
    return (localStorage.getItem("nh.theme") as ThemeMode) || "dark";
  });
  const [accent, setAccentState] = React.useState<string>(() => localStorage.getItem("nh.accent") || "cyan");

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("nh.locale", l);
    document.documentElement.setAttribute("lang", l);
  }, []);
  const toggle = useCallback(() => setLocale(locale === "zh" ? "en" : "zh"), [locale, setLocale]);

  const setTheme = useCallback((t: ThemeMode) => {
    setThemeState(t);
    localStorage.setItem("nh.theme", t);
    applyTheme(t);
  }, []);
  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark");
  }, [theme, setTheme]);

  const setAccent = useCallback((a: string) => {
    setAccentState(a);
    localStorage.setItem("nh.accent", a);
    applyAccent(a);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("lang", locale);
    applyTheme(theme);
    applyAccent(accent);
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => theme === "system" && applyTheme("system");
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<I18nCtx>(() => ({
    locale, t: dict[locale], setLocale, toggle,
    theme, setTheme, toggleTheme, accent, setAccent,
  }), [locale, setLocale, toggle, theme, setTheme, toggleTheme, accent, setAccent]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
