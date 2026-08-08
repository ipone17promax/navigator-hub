import { useState, useEffect, useMemo } from "react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface HighlightItem {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  image: string;
  category: string;
  accent: string;
}

/**
 * 用户自定义图片（优先级最高）：
 *   把自己的截图保存到  src/assets/screenshots/  目录下
 *   文件名 = 下面 id 列表中的任意一个，支持 .jpg / .jpeg / .png / .webp
 *   例如： ai.jpg  dev.png  bilibili.webp  …
 *   构建时会自动导入并覆盖到对应卡片，无需改本文件代码。
 * 如果没放自定义图片，会回退到  public/screenshots/{id}.jpg（默认占位图），
 * 再失败则显示纯色渐变背景，永不空白。
 */
const userImages: Record<string, string> = import.meta.glob(
  "/src/assets/screenshots/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}",
  { eager: true, import: "default", query: "?url" },
) as unknown as Record<string, string>;

function resolveUserImage(id: string): string | null {
  const extPattern = /\.(jpg|jpeg|png|webp)$/i;
  for (const [filePath, resolvedUrl] of Object.entries(userImages)) {
    const base = filePath.split(/[\\/]/).pop()?.replace(extPattern, "");
    if (base?.toLowerCase() === id.toLowerCase()) {
      return resolvedUrl as string;
    }
  }
  return null;
}

const HIGHLIGHTS_RAW: Omit<HighlightItem, "image">[] = [
  {
    id: "deepseek",
    title: "AI 智能助手",
    subtitle: "对话、绘画、编程一站式 AI 平台",
    url: "https://chat.deepseek.com",
    category: "AI",
    accent: "#0066FF",
  },
  {
    id: "github",
    title: "开发者工具",
    subtitle: "代码托管、在线 IDE、文档速查",
    url: "https://github.com",
    category: "开发",
    accent: "#6E5494",
  },
  {
    id: "dribbble",
    title: "设计灵感",
    subtitle: "UI/UX 作品、免费素材、设计工具",
    url: "https://dribbble.com",
    category: "设计",
    accent: "#EA4C89",
  },
  {
    id: "coursera",
    title: "在线学习",
    subtitle: "名校课程、编程学习、技术社区",
    url: "https://www.coursera.org",
    category: "学习",
    accent: "#0056D2",
  },
  {
    id: "bilibili",
    title: "视频娱乐",
    subtitle: "流媒体、短视频、音乐平台",
    url: "https://www.bilibili.com",
    category: "影音",
    accent: "#FB7299",
  },
  {
    id: "notion",
    title: "效率办公",
    subtitle: "文档协作、任务管理、知识沉淀",
    url: "https://www.notion.so",
    category: "办公",
    accent: "#000000",
  },
];

const HIGHLIGHTS: HighlightItem[] = HIGHLIGHTS_RAW.map((it) => ({
  ...it,
  image: resolveUserImage(it.id) ?? `/screenshots/${it.id}.jpg`,
}));

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  AI: Icons.Bot,
  开发: Icons.Code,
  设计: Icons.Palette,
  学习: Icons.GraduationCap,
  影音: Icons.Film,
  办公: Icons.FileText,
};

function FallbackTile({ accent, icon }: { accent: string; icon: LucideIcon }) {
  const Icon = icon;
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${accent}55, ${accent}11 60%, rgba(10,10,26,1))`,
      }}
    >
      <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-white/20 bg-white/5 backdrop-blur-xl">
        <Icon size={44} style={{ color: accent }} />
      </div>
    </div>
  );
}

export default function FeaturedHighlights() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  useEffect(() => {
    if (!isAutoPlay) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % HIGHLIGHTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isAutoPlay]);

  const activeItem = HIGHLIGHTS[activeIdx];

  const goTo = (idx: number) => {
    setActiveIdx(idx);
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 10000);
  };

  const customCount = useMemo(
    () => HIGHLIGHTS_RAW.filter((it) => resolveUserImage(it.id)).length,
    [],
  );

  return (
    <div className="w-full max-w-[1440px] animate-fade-in-up" style={{ animationDelay: "300ms" }}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icons.Sparkles size={18} className="text-amber-400" />
          <span className="text-lg font-semibold text-ink">精选推荐</span>
          <span className="rounded-full bg-brand-gradient/20 px-2 py-0.5 text-[10px] text-amber-300">
            视觉体验
          </span>
          {customCount > 0 && (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300">
              {customCount} 张自定义图
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className="flex items-center gap-1 rounded-lg border border-stroke px-2 py-1 text-xs text-ink-muted transition-colors hover:border-stroke-hover hover:text-ink"
          >
            {isAutoPlay ? <Icons.Pause size={12} /> : <Icons.Play size={12} />}
            {isAutoPlay ? "暂停" : "播放"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <div
            className="group relative overflow-hidden rounded-2xl border border-stroke bg-bg-elevate/40 backdrop-blur-xl transition-all duration-300 hover:border-stroke-hover"
            style={{ height: "280px" }}
          >
            <FallbackTile accent={activeItem.accent} icon={CATEGORY_ICONS[activeItem.category] ?? Icons.Sparkles} />
            <img
              src={activeItem.image}
              alt={activeItem.title}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
              className="absolute inset-0 h-full w-full bg-cover object-cover transition-all duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/30 to-transparent" />

            <div className="absolute inset-0 flex flex-col justify-end p-5">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ background: `${activeItem.accent}33`, color: activeItem.accent }}
                >
                  {activeItem.category}
                </span>
                <span className="text-[10px] text-ink-subtle">精选推荐</span>
              </div>
              <h3 className="text-xl font-bold text-ink">{activeItem.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{activeItem.subtitle}</p>
              <div className="mt-3 flex items-center gap-3">
                <a
                  href={activeItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-glow-lg"
                >
                  立即访问
                  <Icons.ArrowRight size={14} />
                </a>
                <button
                  onClick={() =>
                    window.open(activeItem.url, "_blank", "noopener,noreferrer")
                  }
                  className="flex items-center gap-1 rounded-lg border border-stroke px-3 py-2 text-sm text-ink-muted transition-colors hover:border-stroke-hover hover:text-ink"
                >
                  <Icons.ExternalLink size={14} />
                  新标签
                </button>
              </div>
            </div>

            <div className="absolute right-4 top-4 flex items-center gap-1.5">
              {HIGHLIGHTS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === activeIdx
                      ? "w-6 bg-white"
                      : "w-1.5 bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {HIGHLIGHTS.map((item, idx) => {
            const Icon = CATEGORY_ICONS[item.category] ?? Icons.Sparkles;
            const isActive = idx === activeIdx;
            return (
              <button
                key={item.id}
                onClick={() => goTo(idx)}
                onMouseEnter={() => setIsAutoPlay(false)}
                className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border p-2 text-left transition-all duration-300 ${
                  isActive
                    ? "border-stroke-hover bg-white/10"
                    : "border-stroke/50 bg-bg-elevate/30 hover:border-stroke-hover hover:bg-white/5"
                }`}
              >
                <div
                  className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg"
                  style={{ background: item.accent }}
                >
                  <FallbackTile accent={item.accent} icon={Icon} />
                  <img
                    src={item.image}
                    alt={item.title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Icon size={12} style={{ color: item.accent }} />
                    <span className="text-[10px] text-ink-subtle">{item.category}</span>
                  </div>
                  <div className="truncate text-sm font-medium text-ink">
                    {item.title}
                  </div>
                  <div className="truncate text-[11px] text-ink-subtle">
                    {item.subtitle}
                  </div>
                </div>

                {isActive && (
                  <Icons.ChevronRight
                    size={16}
                    className="flex-shrink-0 text-brand-primary"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
