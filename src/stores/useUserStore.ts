import { create } from "zustand";
import { logger } from "@/lib/logger";

// ============================================================
// 安全的 localStorage 工具
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

const LS = {
  favorites: "navhub:favorites",
  stats: "navhub:visitStats",
  bg: "navhub:background",
} as const;

// ============================================================
// 类型
// ============================================================
export interface VisitRecord {
  siteId: string;
  count: number;
  lastVisit: number; // timestamp
}

export type BgKey = "default" | "stars" | "aurora" | "ocean" | "sunset" | "forest" | "abstract" | "custom";

export interface BgConfig {
  key: BgKey;
  /** 自定义背景图 dataURL */
  customUrl?: string;
  /** 背景透明度 0~1 */
  opacity: number;
}

// ============================================================
// State
// ============================================================
interface UserState {
  // ===== 收藏 =====
  favorites: string[];
  toggleFavorite: (siteId: string) => void;
  isFavorite: (siteId: string) => boolean;

  // ===== 访问统计 =====
  visitStats: Record<string, VisitRecord>;
  recordVisit: (siteId: string) => void;
  clearStats: () => void;
  getTopSites: (limit?: number) => VisitRecord[];

  // ===== 自定义背景 =====
  bgConfig: BgConfig;
  setBgKey: (key: BgKey) => void;
  setBgCustomUrl: (url: string) => void;
  setBgOpacity: (opacity: number) => void;
  resetBg: () => void;
}

const DEFAULT_BG: BgConfig = { key: "default", opacity: 0 };

export const useUserStore = create<UserState>((set, get) => ({
  // ===== 收藏 =====
  favorites: safeGet<string[]>(LS.favorites, []),
  toggleFavorite: (siteId) => {
    const prev = get().favorites;
    const next = prev.includes(siteId)
      ? prev.filter((id) => id !== siteId)
      : [...prev, siteId];
    set({ favorites: next });
    safeSet(LS.favorites, next);
    logger.info("UserStore", "切换收藏", { siteId, favorited: !prev.includes(siteId) });
  },
  isFavorite: (siteId) => get().favorites.includes(siteId),

  // ===== 访问统计 =====
  visitStats: safeGet<Record<string, VisitRecord>>(LS.stats, {}),
  recordVisit: (siteId) => {
    const prev = get().visitStats;
    const existing = prev[siteId];
    const record: VisitRecord = {
      siteId,
      count: (existing?.count ?? 0) + 1,
      lastVisit: Date.now(),
    };
    const next = { ...prev, [siteId]: record };
    set({ visitStats: next });
    safeSet(LS.stats, next);
  },
  clearStats: () => {
    set({ visitStats: {} });
    safeSet(LS.stats, {});
    logger.info("UserStore", "清空访问统计");
  },
  getTopSites: (limit = 10) => {
    const stats = get().visitStats;
    return Object.values(stats)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },

  // ===== 自定义背景 =====
  bgConfig: safeGet<BgConfig>(LS.bg, DEFAULT_BG),
  setBgKey: (key) => {
    const next = { ...get().bgConfig, key };
    set({ bgConfig: next });
    safeSet(LS.bg, next);
    applyBg(next);
  },
  setBgCustomUrl: (url) => {
    const next = { ...get().bgConfig, key: "custom" as BgKey, customUrl: url };
    set({ bgConfig: next });
    safeSet(LS.bg, next);
    applyBg(next);
  },
  setBgOpacity: (opacity) => {
    const next = { ...get().bgConfig, opacity };
    set({ bgConfig: next });
    safeSet(LS.bg, next);
    applyBg(next);
  },
  resetBg: () => {
    set({ bgConfig: DEFAULT_BG });
    safeSet(LS.bg, DEFAULT_BG);
    applyBg(DEFAULT_BG);
  },
}));

// ============================================================
// 背景预设：CSS 渐变（无需外部图片，秒加载）
// ============================================================
export const BG_PRESETS: Record<Exclude<BgKey, "default" | "custom">, string> = {
  stars:
    "radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a1a 50%, #000000 100%), radial-gradient(circle at 20% 30%, rgba(99,102,241,0.15) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(236,72,153,0.1) 0%, transparent 40%)",
  aurora:
    "linear-gradient(135deg, #0b1220 0%, #0d2818 30%, #0a1a2e 60%, #08111f 100%), radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.2) 0%, transparent 60%)",
  ocean:
    "linear-gradient(180deg, #001220 0%, #003049 40%, #00496d 70%, #006d8a 100%), radial-gradient(circle at 30% 80%, rgba(14,165,233,0.15) 0%, transparent 50%)",
  sunset:
    "linear-gradient(180deg, #1a0a2e 0%, #2d1b3d 25%, #4a1942 50%, #6b2c5a 75%, #c2453e 100%), radial-gradient(circle at 70% 90%, rgba(251,146,60,0.2) 0%, transparent 50%)",
  forest:
    "linear-gradient(180deg, #0a1f0a 0%, #0d2818 30%, #1a3a1a 60%, #0d1f0d 100%), radial-gradient(circle at 40% 60%, rgba(34,197,94,0.12) 0%, transparent 50%)",
  abstract:
    "conic-gradient(from 45deg at 50% 50%, #1a0a2e, #16213e, #0f3460, #533483, #1a0a2e), radial-gradient(circle at 60% 40%, rgba(99,102,241,0.12) 0%, transparent 50%)",
};

/** 将背景配置应用到 DOM */
function applyBg(config: BgConfig) {
  const el = document.getElementById("app-bg-layer");
  if (!el) return;

  if (config.key === "default") {
    el.style.background = "";
    el.style.opacity = "0";
    return;
  }

  if (config.key === "custom" && config.customUrl) {
    el.style.background = `url(${config.customUrl}) center/cover no-repeat fixed`;
    el.style.opacity = String(config.opacity || 0.3);
    return;
  }

  const preset = BG_PRESETS[config.key as Exclude<BgKey, "default" | "custom">];
  if (preset) {
    el.style.background = preset;
    el.style.opacity = String(config.opacity || 0.5);
  }
}

// 初始化时应用背景
if (typeof window !== "undefined") {
  // 等 DOM ready 后应用
  const init = () => applyBg(useUserStore.getState().bgConfig);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}
