import { useMemo } from "react";
import * as Icons from "lucide-react";
import SiteCard from "./SiteCard";
import { SITES, CATEGORIES } from "@/config/sites";
import { useAppStore } from "@/stores/useAppStore";
import { useUserStore } from "@/stores/useUserStore";
import { useI18n } from "@/i18n";
import { runHealthCheck } from "./HealthAndFreq";

export default function SiteGrid() {
  const activeCat = useAppStore((s) => s.activeCategoryId);
  const favorites = useUserStore((s) => s.favorites);
  const favOrder = useUserStore((s) => s.favoriteOrder);
  const customSites = useUserStore((s) => s.customSites);
  const customCats = useUserStore((s) => s.customCats);
  const layout = useUserStore((s) => s.layout);
  const removeSite = useUserStore((s) => s.removeSite);
  const unlocked = useUserStore((s) => s.privateUnlocked);
  const { t } = useI18n();

  const privateCatIds = useMemo(() => new Set(customCats.filter((c) => c.private).map((c) => c.id)), [customCats]);
  const privateHidden = (catId: string) => !unlocked && privateCatIds.has(catId);

  // 全部站点（内置 + 自定义），附带 custom 标记
  const allSites = useMemo<any[]>(() => {
    const list: any[] = SITES.map((s) => ({ ...s, categoryId: s.category as string, desc: s.description, builtIn: true, custom: false }));
    customSites.forEach((s) => list.push({
      id: s.id, name: s.name, url: s.url, desc: s.desc || "", iconName: s.icon || "Globe", categoryId: s.categoryId, builtIn: false, custom: true,
    }));
    return list;
  }, [customSites]);

  const visibleSites = useMemo(() => {
    let list = allSites;
    // 隐私分类过滤
    list = list.filter((s) => !privateHidden(s.categoryId));
    const allCatIds = [
      ...CATEGORIES.map((c) => c.key),
      ...customCats.map((c) => c.id),
    ];
    if (activeCat !== "all") {
      list = list.filter((s) => s.categoryId === activeCat);
    }
    // 排序：分类 order，内置顺序
    const idxMap = new Map(allCatIds.map((id, i) => [id, i]));
    list.sort((a, b) => (idxMap.get(a.categoryId) ?? 99) - (idxMap.get(b.categoryId) ?? 99));
    return list;
  }, [allSites, activeCat, customCats, privateHidden]);

  const favSites = useMemo(() => {
    const orderedFavs = favOrder.filter((x) => favorites.includes(x));
    const rest = favorites.filter((x) => !favOrder.includes(x));
    const ids = [...orderedFavs, ...rest];
    return ids
      .map((id) => allSites.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => !!s && !privateHidden(s.categoryId));
  }, [allSites, favorites, favOrder, privateHidden]);

  const cols = layout === "compact" ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
           : layout === "large"   ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
           : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-8">
      {favSites.length > 0 && (
        <section className="animate-fade-in-up">
          <div className="mb-3 flex items-center gap-2 px-1">
            <Icons.Star size={14} className="text-amber-400" fill="currentColor" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">{t.fav.title}</h2>
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-ink-subtle">
              <Icons.GripVertical size={12} /> {t.layout.dragHint}
            </span>
          </div>
          <div className={`grid gap-4 ${cols}`}>
            {favSites.map((s, i) => (
              <div key={"fav-" + s.id} draggable onDragStart={() => {}}>
                <SiteCard
                  id={s.id} name={s.name} url={s.url} desc={s.desc} iconName={s.iconName}
                  categoryId={s.categoryId} custom={s.custom} index={i + 1}
                  onDeleteCustom={s.custom ? () => removeSite(s.id) : undefined}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="animate-fade-in-up">
        <div className="mb-3 flex items-center gap-2 px-1">
          <Icons.LayoutGrid size={14} className="text-brand-primary" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
            {activeCat === "all" ? t.cats.all : (
              CATEGORIES.find((c) => c.key === activeCat)?.label
              || customCats.find((c) => c.id === activeCat)?.name
              || ""
            )}
          </h2>
          <span className="ml-auto inline-flex items-center gap-2">
            <span className="text-[11px] text-ink-subtle">{visibleSites.length}</span>
            <button
              onClick={() => runHealthCheck(visibleSites.map((s) => s.id))}
              className="inline-flex items-center gap-1 rounded-lg border border-stroke px-2 py-0.5 text-[11px] text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
              title={t.health.check}
            >
              <Icons.Activity size={12} className="text-emerald-400" />
              {t.health.check}
            </button>
          </span>
        </div>
        {visibleSites.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stroke bg-white/[0.02] p-10 text-center text-sm text-ink-muted">
            {unlocked ? t.fav.empty : t.user.guestHint}
          </div>
        ) : (
          <div className={`grid gap-4 ${cols}`}>
            {visibleSites.map((s, i) => (
              <SiteCard
                key={s.id}
                id={s.id} name={s.name} url={s.url} desc={s.desc} iconName={s.iconName}
                categoryId={s.categoryId} custom={s.custom} index={i + 1}
                onDeleteCustom={s.custom ? () => removeSite(s.id) : undefined}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
