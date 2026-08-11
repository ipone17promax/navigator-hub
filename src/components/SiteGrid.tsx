import { useMemo } from "react";
import { Ghost, Star } from "lucide-react";
import { useAppStore } from "@/stores/useAppStore";
import { useUserStore } from "@/stores/useUserStore";
import { useI18n } from "@/i18n";
import { SITES } from "@/config/sites";
import SiteCard from "./SiteCard";

export default function SiteGrid() {
  const activeCategory = useAppStore((s) => s.activeCategory);
  const keyword = useAppStore((s) => s.keyword);
  const favorites = useUserStore((s) => s.favorites);
  const { t } = useI18n();

  const list = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return SITES.filter((s) => {
      const categoryOk = activeCategory === "all" ? true : s.category === activeCategory;
      if (!categoryOk) return false;
      if (!kw) return true;
      return (
        s.name.toLowerCase().includes(kw) ||
        s.description.toLowerCase().includes(kw) ||
        s.url.toLowerCase().includes(kw)
      );
    });
  }, [activeCategory, keyword]);

  // 收藏的站点（仅在全部分类 + 无搜索词时显示）
  const favList = useMemo(() => {
    if (activeCategory !== "all" || keyword.trim()) return [];
    return SITES.filter((s) => favorites.includes(s.id));
  }, [favorites, activeCategory, keyword]);

  return (
    <section className="w-full animate-fade-in-up" style={{ animationDelay: "220ms" }}>
      {/* 分类筛选结果数量提示 */}
      <div className="mb-4 flex items-center justify-between text-xs text-ink-muted">
        <div>
          {t.siteCount} <span className="font-semibold text-ink">{list.length}</span> {t.sites}
          {activeCategory !== "all" && <span> · {t.categoryFiltering}</span>}
        </div>
        <div className="opacity-70">
          {t.rightClickTip}
        </div>
      </div>

      {/* 收藏区 */}
      {favList.length > 0 && (
        <div className="mb-5">
          <div className="mb-3 flex items-center gap-2">
            <Star size={15} className="fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold text-ink">{t.favoritesTitle}</span>
            <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] text-amber-400">
              {favList.length} {t.favoritesCount}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {favList.map((site, idx) => (
              <SiteCard key={site.id} site={site} index={idx} />
            ))}
          </div>
          <div className="my-4 border-t border-stroke/50" />
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {list.map((site, idx) => (
            <SiteCard key={site.id} site={site} index={idx} />
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  const { t } = useI18n();
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="relative">
        <div className="absolute -inset-8 rounded-full bg-brand-gradient-soft opacity-40 blur-2xl" />
        <Ghost size={48} className="relative text-ink-subtle" strokeWidth={1.25} />
      </div>
      <div>
        <p className="font-display text-lg font-semibold text-ink">{t.noMatchTitle}</p>
        <p className="mt-1 text-sm text-ink-muted">
          {t.noMatchDesc}
        </p>
      </div>
    </div>
  );
}
