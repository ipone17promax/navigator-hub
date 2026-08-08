import { useAppStore } from "@/stores/useAppStore";
import { CATEGORIES, SITES } from "@/config/sites";
import type { SiteCategory } from "@/shared/types";

/**
 * 分类 Pill 标签栏：横向排列，可滚动
 * 每个 Pill 显示对应分类下网站数量
 */
export default function CategoryTabs() {
  const active = useAppStore((s) => s.activeCategory);
  const setActive = useAppStore((s) => s.setActiveCategory);

  // 分类计数
  const counts = SITES.reduce<Record<string, number>>((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + 1;
    return acc;
  }, {});
  counts["all"] = SITES.length;

  return (
    <div className="w-full min-w-0 animate-fade-in-up" style={{ animationDelay: "160ms" }}>
      <div className="-mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 py-1 sm:justify-center">
        {CATEGORIES.map((c, idx) => {
          const count = counts[c.key] ?? 0;
          const isActive = active === c.key;
          return (
            <button
              type="button"
              key={c.key}
              onClick={() => setActive(c.key as SiteCategory)}
              className={`brand-pill shrink-0 ${isActive ? "is-active" : ""}`}
              style={{ animation: `fadeInUp .55s ${200 + idx * 40}ms both` }}
            >
              <span className="text-base leading-none" aria-hidden>
                {c.icon}
              </span>
              <span>{c.label}</span>
              <span
                className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                  isActive ? "bg-white/25 text-white" : "bg-white/10 text-ink-subtle"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
