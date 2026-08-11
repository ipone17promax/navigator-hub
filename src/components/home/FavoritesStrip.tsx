import * as Icons from "lucide-react";
import { useI18n } from "@/i18n";
import { SITES, CATEGORIES } from "@/config/sites";
import { useUserStore } from "@/stores/useUserStore";
import { resolveIcon } from "@/lib/icons";

/**
 * 360 风格收藏条：分类Tab下方、站点网格上方，横向展示收藏站点
 * 没有收藏时不渲染，避免占位
 */
export default function FavoritesStrip() {
  const { t } = useI18n();
  const favorites = useUserStore((s) => s.favorites);
  const favOrder = useUserStore((s) => s.favoriteOrder);
  const customSites = useUserStore((s) => s.customSites);
  const recordVisit = useUserStore((s) => s.recordVisit);

  const favIds = [...favOrder.filter((x) => favorites.includes(x)), ...favorites.filter((x) => !favOrder.includes(x))];
  if (favIds.length === 0) return null;

  const allSites = [
    ...SITES.map((s) => ({ id: s.id, name: s.name, url: s.url, category: s.category, iconName: s.iconName || "Globe" })),
    ...customSites.map((s) => ({ id: s.id, name: s.name, url: s.url, category: (s as any).categoryId || "all", iconName: s.icon || "Globe" })),
  ];

  const open = (site: { id: string; name: string; url: string; category?: string }) => {
    const u = site.url.startsWith("http") ? site.url : "https://" + site.url;
    recordVisit({ siteId: site.id, siteName: site.name, url: site.url, categoryId: site.category });
    window.open(u, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="relative z-10 px-4 pb-2 sm:px-6">
      <div className="mx-auto w-full max-w-7xl rounded-2xl border border-stroke bg-bg-elevate/50 p-3 backdrop-blur-sm shadow-glow-xs">
        <div className="mb-2 flex items-center gap-2 px-1">
          <Icons.Star size={14} className="text-amber-400" />
          <span className="text-[12px] font-semibold tracking-wide text-ink/80">
            {(t as any).favorites?.title ?? t.fav.title}
          </span>
          <span className="text-[10px] text-ink-muted">({favIds.length})</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {favIds.map((id) => {
            const s = allSites.find((x) => x.id === id);
            if (!s) return null;
            const I = resolveIcon(s.iconName, Icons.Globe);
            return (
              <button
                key={id}
                onClick={() => open(s)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stroke bg-bg-elevate/40 px-2.5 py-1.5 text-[12px] text-ink/80 transition-all hover:border-stroke-hover hover:bg-white/5 hover:text-ink"
              >
                <I size={13} />
                <span className="max-w-[8rem] truncate">{s.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
