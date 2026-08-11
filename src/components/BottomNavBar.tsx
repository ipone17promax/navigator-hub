import { useMemo, useRef, useState } from "react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "@/i18n";
import { SITES, CATEGORIES } from "@/config/sites";

interface QuickLink {
  label: string;
  url: string;
  icon: LucideIcon;
  accent: string;
}

/** 每个分类取前 6 个站点，用于底部快捷栏 */
const QUICK_LINKS: Record<string, QuickLink[]> = Object.fromEntries(
  CATEGORIES
    .filter((c) => c.key !== "all")
    .map((cat) => [
      cat.key,
      SITES.filter((s) => s.category === cat.key)
        .slice(0, 6)
        .map((s) => ({
          label: s.name,
          url: s.url,
          icon:
            (Icons as unknown as Record<string, LucideIcon>)[s.iconName] ??
            Icons.Link,
          accent: s.accent,
        })),
    ]),
);

const VALID_CATEGORIES = CATEGORIES.filter((c) => c.key !== "all" && QUICK_LINKS[c.key]?.length > 0);

function getCategoryIcon(iconKey: string): LucideIcon {
  const map: Record<string, string> = {
    search:  "Search",
    dev:     "Code",
    ai:      "Bot",
    design:  "Palette",
    social:  "MessageSquare",
    video:   "Film",
    learn:   "GraduationCap",
    office:  "Zap",
    weather: "CloudSun",
    tools:   "Wrench",
  };
  const name = map[iconKey] ?? "Link";
  return (Icons as unknown as Record<string, LucideIcon>)[name] ?? Icons.Link;
}

export default function BottomNavBar() {
  const [activeCat, setActiveCat] = useState<string>(VALID_CATEGORIES[0]?.key ?? "search");
  const { t } = useI18n();

  const items = useMemo(() => QUICK_LINKS[activeCat] ?? [], [activeCat]);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) < 50) return; // 最小滑动距离
    const currentIdx = VALID_CATEGORIES.findIndex((c) => c.key === activeCat);
    if (diff > 0 && currentIdx < VALID_CATEGORIES.length - 1) {
      setActiveCat(VALID_CATEGORIES[currentIdx + 1].key);
    } else if (diff < 0 && currentIdx > 0) {
      setActiveCat(VALID_CATEGORIES[currentIdx - 1].key);
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <div className="w-full max-w-[1440px]">
      {/* 外层容器：圆角 + 玻璃拟态 */}
      <div className="rounded-2xl border border-stroke bg-bg-elevate/60 p-4 backdrop-blur-xl transition-all duration-300 hover:border-stroke-hover">
        {/* 标题栏 */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.LayoutGrid size={16} className="text-brand-primary" />
            <span className="text-sm font-semibold text-ink">{t.quickNav}</span>
            <span className="rounded-full bg-brand-gradient/20 px-2 py-0.5 text-[10px] text-brand-primary">
              {items.length} {t.quickNavCount}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-ink-subtle">
            <Icons.MousePointer size={12} />
            <span>{t.quickNavTip} · {t.swipeTip}</span>
            <Icons.Move size={12} />
          </div>
        </div>

        {/* 分类标签（固定在上） */}
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {VALID_CATEGORIES.map((cat) => {
            const CatIcon = getCategoryIcon(cat.key);
            const isActive = activeCat === cat.key;
            const count = QUICK_LINKS[cat.key]?.length ?? 0;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCat(cat.key)}
                className={`group flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-brand-gradient text-white shadow-glow"
                    : "text-ink-muted hover:bg-white/5 hover:text-ink"
                }`}
                style={
                  isActive ? { boxShadow: `0 0 12px 2px ${cat.accent}55` } : undefined
                }
                title={`${cat.label}（${count}个）`}
              >
                <CatIcon size={13} />
                <span>{cat.label}</span>
                <span
                  className={`ml-0.5 rounded px-1 py-0.5 text-[9px] ${
                    isActive ? "bg-white/20" : "bg-white/5"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 站点快捷条：可横向拖动滚动 */}
        <div
          className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(148, 163, 184, 0.5) transparent",
          }}
        >
          {items.map((it) => (
            <a
              key={it.label}
              href={it.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-shrink-0 flex-col items-center gap-1.5 rounded-xl border border-stroke/50 bg-white/3 px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-stroke-hover hover:bg-white/8 hover:shadow-glow"
              style={{ width: "92px" }}
              title={it.label}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110"
                style={{
                  background: `linear-gradient(135deg, ${it.accent}33, ${it.accent}11)`,
                }}
              >
                <it.icon size={18} style={{ color: it.accent }} />
              </div>
              <span className="max-w-full truncate text-[11px] font-medium text-ink">
                {it.label}
              </span>
              <Icons.ChevronRight
                size={10}
                className="translate-y-[-2px] scale-0 text-ink-subtle transition-transform duration-200 group-hover:translate-x-0 group-hover:scale-100"
              />
            </a>
          ))}
        </div>

        {/* 自定义滚动条样式（firefox 由 style=scrollbarWidth 处理） */}
        <style>{`
          .overflow-x-auto::-webkit-scrollbar {
            height: 6px;
          }
          .overflow-x-auto::-webkit-scrollbar-track {
            background: transparent;
          }
          .overflow-x-auto::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.35);
            border-radius: 9999px;
          }
          .overflow-x-auto::-webkit-scrollbar-thumb:hover {
            background: rgba(148, 163, 184, 0.6);
          }
        `}</style>
      </div>
    </div>
  );
}