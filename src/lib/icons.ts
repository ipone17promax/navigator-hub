import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONS = Icons as unknown as Record<string, LucideIcon>;

/**
 * 统一图标解析（所有组件必须走这个入口）
 * - 找不到名称时自动 fallback，绝不返回 undefined
 * - 同一个名称在任何组件返回同一个 LucideIcon 引用，消除一致性差异
 */
export function resolveIcon(name?: string | null, fallback: LucideIcon = Icons.Globe): LucideIcon {
  if (!name) return fallback;
  const hit = ICONS[name];
  if (hit && typeof hit === "function") return hit;
  return fallback;
}

/**
 * 按分类 key 返回 360 风格分类图标（中文导航站常用）
 */
export function categoryIcon(key: string): LucideIcon {
  const m: Record<string, LucideIcon> = {
    all: Icons.LayoutGrid,
    search: Icons.Search,
    dev: Icons.Code2,
    ai: Icons.Bot,
    design: Icons.Palette,
    social: Icons.MessageCircle,
    video: Icons.Video,
    learn: Icons.BookOpen,
    office: Icons.Briefcase,
    weather: Icons.CloudSun,
    tools: Icons.Wrench,
    life: Icons.HeartHandshake,
  };
  return m[key] ?? Icons.Folder;
}
