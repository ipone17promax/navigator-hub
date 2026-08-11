import { create } from "zustand";
import type { SiteCategory, ThemeKey } from "@/shared/types";
import type { Locale } from "@/i18n/translations";
import { LS_KEYS, THEMES } from "@/config/themes";
import { SEARCH_ENGINES } from "@/config/sites";
import { logger } from "@/lib/logger";

// ============================================================
// 安全的 localStorage 读取工具（SSR / 隐私模式兜底）
// ============================================================
const safeGet = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};

const safeSet = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
};

// ============================================================
// State
// ============================================================
interface AppState {
  // 主题
  activeTheme: ThemeKey;
  setActiveTheme: (t: ThemeKey) => void;

  // 搜索引擎
  activeEngineId: string;
  setActiveEngineId: (id: string) => void;

  // 分类筛选
  activeCategory: SiteCategory;
  setActiveCategory: (c: SiteCategory) => void;

  // 搜索关键词（卡片即时过滤用）
  keyword: string;
  setKeyword: (k: string) => void;

  // 关爱老人模式（全局放大字体）
  elderlyMode: boolean;
  toggleElderlyMode: () => void;

  // 多语言
  locale: Locale;
  setLocale: (l: Locale) => void;
}

export const useAppStore = create<AppState>((set) => {
  // 初始化：从 localStorage 读取，否则使用默认值
  const savedTheme = safeGet<ThemeKey>(LS_KEYS.theme, "cyber");
  const savedEngine = safeGet<string>(LS_KEYS.engine, SEARCH_ENGINES[0].id);
  const savedCategory = safeGet<SiteCategory>(LS_KEYS.lastCategory, "all");
  const savedElderly = safeGet<boolean>(LS_KEYS.elderlyMode, false);
  const savedLocale = safeGet<Locale>(LS_KEYS.locale, "zh");

  // 首次注入主题到 HTML
  const t = THEMES[savedTheme] ? savedTheme : "cyber";
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", t);
    // 首次注入关爱老人字体
    if (savedElderly) {
      document.documentElement.style.fontSize = "20px";
    }
  }

  return {
    activeTheme: t,
    setActiveTheme: (theme: ThemeKey) => {
      if (!THEMES[theme]) return;
      set({ activeTheme: theme });
      safeSet(LS_KEYS.theme, theme);
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", theme);
      }
    },

    activeEngineId: SEARCH_ENGINES.some((e) => e.id === savedEngine)
      ? savedEngine
      : SEARCH_ENGINES[0].id,
    setActiveEngineId: (id: string) => {
      set({ activeEngineId: id });
      safeSet(LS_KEYS.engine, id);
    },

    activeCategory: savedCategory,
    setActiveCategory: (c: SiteCategory) => {
      set({ activeCategory: c });
      safeSet(LS_KEYS.lastCategory, c);
    },

    keyword: "",
    setKeyword: (k: string) => set({ keyword: k.trim() }),

    elderlyMode: savedElderly,
    toggleElderlyMode: () => {
      const next = !useAppStore.getState().elderlyMode;
      set({ elderlyMode: next });
      safeSet(LS_KEYS.elderlyMode, next);
      if (typeof document !== "undefined") {
        document.documentElement.style.fontSize = next ? "20px" : "16px";
      }
      logger.info("AppStore", "切换老人模式", { enabled: next });
    },

    locale: savedLocale,
    setLocale: (l: Locale) => {
      set({ locale: l });
      safeSet(LS_KEYS.locale, l);
    },
  };
});
