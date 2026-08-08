import type { ThemeConfig, ThemeKey } from "@/shared/types";

export const THEMES: Record<ThemeKey, ThemeConfig> = {
  cyber: {
    key: "cyber",
    name: "赛博紫",
    primary: "#6366F1",
    secondary: "#EC4899",
    bg: "#0A0A1A",
    dot: "linear-gradient(135deg,#6366F1,#EC4899)",
  },
  aurora: {
    key: "aurora",
    name: "极光绿",
    primary: "#10B981",
    secondary: "#3B82F6",
    bg: "#0B1220",
    dot: "linear-gradient(135deg,#10B981,#3B82F6)",
  },
  ocean: {
    key: "ocean",
    name: "深海蓝",
    primary: "#0EA5E9",
    secondary: "#8B5CF6",
    bg: "#08111F",
    dot: "linear-gradient(135deg,#0EA5E9,#8B5CF6)",
  },
};

export const THEME_ORDER: ThemeKey[] = ["cyber", "aurora", "ocean"];

/** localStorage 键名 */
export const LS_KEYS = {
  theme: "navhub:theme",
  engine: "navhub:engine",
  lastCategory: "navhub:lastCategory",
  elderlyMode: "navhub:elderlyMode",
  // 内部日志系统
  logs: "navhub:logs",
} as const;
