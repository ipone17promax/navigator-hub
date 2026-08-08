// ============================================================
// 全局共享类型定义
// ============================================================

export type ThemeKey = "cyber" | "aurora" | "ocean";

export interface ThemeConfig {
  key: ThemeKey;
  name: string;
  primary: string;
  secondary: string;
  bg: string;
  dot: string; // 主题切换器圆点的展示色
}

export type SiteCategory =
  | "all"
  | "search"
  | "dev"
  | "ai"
  | "design"
  | "social"
  | "video"
  | "learn"
  | "office"
  | "weather"
  | "tools";

export interface CategoryMeta {
  key: SiteCategory;
  label: string;
  icon: string; // emoji 或 标识文字
  accent: string; // 卡片/悬停主题色
}

export interface SiteItem {
  id: string;
  name: string;
  description: string;
  url: string;
  category: Exclude<SiteCategory, "all">;
  /** Lucide icon name — 实际渲染使用 lucide-react 图标组件（按名称查找）*/
  iconName: string;
  /** 卡片左上装饰色（渐变起始色） */
  accent: string;
}

export interface SearchEngine {
  id: string;
  name: string;
  /** {query} 占位符将被 URL 编码后的搜索词替换 */
  urlTemplate: string;
  /** Lucide 图标名 */
  iconName: string;
  /** 品牌色（下拉选中高亮） */
  accent: string;
}
