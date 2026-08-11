import * as Icons from "lucide-react";
import { useI18n } from "@/i18n";
import { SITES, CATEGORIES } from "@/config/sites";
import { useAppStore } from "@/stores/useAppStore";
import { useUserStore } from "@/stores/useUserStore";
import { resolveIcon } from "@/lib/icons";

/**
 * 360 风格左侧分类栏：
 *   - 顶部大分类图标入口（全部/AI/开发/设计/学习/影音/办公/工具…）
 *   - 每个分类下方列出前 3 个高热度/常用站点（点击直达）
 *   - 下方放收藏夹缩略列表
 */
export default function LeftSidebar() {
  const { t } = useI18n();
  const activeCat = useAppStore((s) => s.activeCategoryId);
  const setCat = useAppStore((s) => s.setActiveCategoryId);
  const customCats = useUserStore((s) => s.customCats);
  const favorites = useUserStore((s) => s.favorites);
  const favOrder = useUserStore((s) => s.favoriteOrder);
  const recordVisit = useUserStore((s) => s.recordVisit);
  const customSites = useUserStore((s) => s.customSites);

  const favIds = [...favOrder.filter((x) => favorites.includes(x)), ...favorites.filter((x) => !favOrder.includes(x))];
  const allSites = [
    ...SITES.map((s) => ({ id: s.id, name: s.name, url: s.url, category: s.category, description: s.description || "", iconName: s.iconName || "Globe" })),
    ...customSites.map((s) => ({ id: s.id, name: s.name, url: s.url, category: (s as any).categoryId || "all", description: s.desc || "", iconName: s.icon || "Globe" })),
  ];

  const open = (site: { id: string; name: string; url: string; category?: string }) => {
    const u = site.url.startsWith("http") ? site.url : "https://" + site.url;
    recordVisit({ siteId: site.id, siteName: site.name, url: site.url, categoryId: site.category });
    window.open(u, "_blank", "noopener,noreferrer");
  };

  return (
    <aside className="hidden lg:flex w-56 shrink-0 flex-col gap-3 pt-2 pr-2">
      {/* 分类列表 */}
      <div className="rounded-2xl border border-stroke bg-bg-elevate/50 p-3 backdrop-blur-sm shadow-glow-xs">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-[12px] font-semibold tracking-wide text-ink/80">{(t as any).categories?.title ?? (t.cats && t.cats.all ? t.cats.all : "分类")}</span>
          <Icons.ChevronRight size={12} className="text-ink-muted" />
        </div>
        <ul className="flex flex-col gap-0.5">
          <li key="all">
            <button
              onClick={() => setCat("all")}
              className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-[13px] transition-all ${
                activeCat === "all" ? "bg-brand-gradient text-white shadow-glow-xs" : "text-ink-muted hover:bg-white/5 hover:text-ink"
              }`}
            >
              <Icons.LayoutGrid size={15} />
              <span className="truncate">{(t as any).categories?.all ?? t.cats.all}</span>
              <span className="ml-auto text-[10px] opacity-70">{allSites.length}</span>
            </button>
          </li>
          {CATEGORIES.map((c) => {
            const I = resolveIcon(null, Icons.Folder);
            const count = allSites.filter((s) => s.category === c.key).length;
            const labelText = (t.cats && t.cats[c.key]) ? String(t.cats[c.key]) : c.label;
            return (
              <li key={c.key}>
                <button
                  onClick={() => setCat(c.key)}
                  className={`group flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-[13px] transition-all ${
                    activeCat === c.key ? "bg-brand-gradient text-white shadow-glow-xs" : "text-ink-muted hover:bg-white/5 hover:text-ink"
                  }`}
                >
                  <span className="w-5 text-center shrink-0">{c.icon}</span>
                  <span className="truncate">{labelText}</span>
                  <span className="ml-auto text-[10px] opacity-70">{count}</span>
                </button>
                {/* 分类下的快捷站点（非全部时展示，只在激活状态展开） */}
                {activeCat === c.key && count > 0 && (
                  <ul className="mt-1 flex flex-col gap-0.5 pl-6">
                    {allSites
                      .filter((s) => s.category === c.key)
                      .slice(0, 3)
                      .map((s) => (
                        <li key={s.id}>
                          <button
                            onClick={() => open(s)}
                            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] text-ink-muted/80 transition-colors hover:bg-white/5 hover:text-ink"
                          >
                            <Icons.CircleDot size={10} />
                            <span className="truncate">{s.name}</span>
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
              </li>
            );
          })}
          {customCats.map((c) => {
            const count = allSites.filter((s) => s.category === c.id).length;
            const I = resolveIcon(c.iconName, Icons.Folder);
            return (
              <li key={c.id}>
                <button
                  onClick={() => setCat(c.id)}
                  className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-[13px] transition-all ${
                    activeCat === c.id ? "bg-brand-gradient text-white shadow-glow-xs" : "text-ink-muted hover:bg-white/5 hover:text-ink"
                  }`}
                >
                  <I size={15} />
                  <span className="truncate">{c.name}</span>
                  <span className="ml-auto text-[10px] opacity-70">{count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 收藏夹快捷入口（360 风格的"我的常用"） */}
      <div className="rounded-2xl border border-stroke bg-bg-elevate/50 p-3 backdrop-blur-sm shadow-glow-xs">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-[12px] font-semibold tracking-wide text-ink/80">{(t as any).favorites?.title ?? t.fav.title}</span>
          <Icons.Star size={12} className="text-amber-400" />
        </div>
        {favIds.length === 0 ? (
          <p className="px-2 py-1 text-[11px] text-ink-muted">{(t as any).favorites?.empty ?? t.fav.empty}</p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {favIds.slice(0, 8).map((id) => {
              const s = allSites.find((x) => x.id === id);
              if (!s) return null;
              const I = resolveIcon(s.iconName, Icons.Globe);
              return (
                <li key={id}>
                  <button
                    onClick={() => open(s)}
                    className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] text-ink-muted/80 transition-colors hover:bg-white/5 hover:text-ink"
                  >
                    <I size={13} />
                    <span className="truncate">{s.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
