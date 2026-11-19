import { lazy, Suspense, useEffect } from "react";
import * as Icons from "@/lib/iconRegistry";
import { useI18n } from "@/i18n";
import HeaderActions from "@/components/home/HeaderActions";
import FooterActions from "@/components/home/FooterActions";
import SearchBlock from "@/components/home/SearchBlock";
import ContentArea from "@/components/home/ContentArea";
import ContentCenter from "@/components/home/ContentCenter";
import FavoritesStrip from "@/components/home/FavoritesStrip";

// 非首屏关键组件按需加载，减小首屏主包体积
const InfoStrip = lazy(() => import("@/components/home/InfoStrip"));
const CommandPalette = lazy(() => import("@/components/CommandPalette"));
const PullToRefresh = lazy(() => import("@/components/PullToRefresh"));
import { useAppStore } from "@/stores/useAppStore";
import { useUserStore } from "@/stores/useUserStore";
import { SITES, CATEGORIES } from "@/config/sites";

/**
 * HomePage：360 导航风格单栏垂直堆叠
 *   顶部：logo + 工具栏(含迷你天气)
 *   搜索区：logo + 引擎Tab + 搜索框 + 健康条 + 快捷工具
 *   收藏条：横向收藏站点(有收藏才显示)
 *   主内容：精选轮播 + 分类横向Tab + 站点网格
 *   信息条：天气/日历/行情/新闻 横排4列
 *   底部：页脚 + 移动端导航
 *
 * 左侧栏(LeftSidebar)和右侧栏(RightPanel)组件文件保留不删，
 * 但 HomePage 不再引用——改用 FavoritesStrip + InfoStrip 替代其功能。
 */
export default function HomePage() {
  const { t, toggle, toggleTheme, locale } = useI18n();
  const setCat = useAppStore((s) => s.setActiveCategoryId);
  const activeCat = useAppStore((s) => s.activeCategoryId);
  const customSites = useUserStore((s) => s.customSites);
  const customCats = useUserStore((s) => s.customCats);
  const recordVisit = useUserStore((s) => s.recordVisit);
  const favorites = useUserStore((s) => s.favorites);
  const favOrder = useUserStore((s) => s.favoriteOrder);
  const unlockPriv = useUserStore((s) => s.unlockPrivate);
  const unlocked = useUserStore((s) => s.privateUnlocked);

  // 全局快捷键
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        useAppStore.getState().toggleCommandPalette();
        return;
      }
      if (!typing && /^[1-9]$/.test(e.key)) {
        const n = parseInt(e.key, 10);
        e.preventDefault();
        const favIds = [...favOrder.filter((x) => favorites.includes(x)), ...favorites.filter((x) => !favOrder.includes(x))];
        const openByIndex = (list: any[]) => {
          const s = list[n - 1];
          if (!s) return;
          const u = s.url.startsWith("http") ? s.url : "https://" + s.url;
          recordVisit({ siteId: s.id, siteName: s.name, url: s.url, categoryId: s.categoryId || s.category });
          window.open(u, "_blank", "noopener,noreferrer");
        };
        if (favIds.length >= n) {
          const all = [
            ...SITES.map((s) => ({ ...s })),
            ...customSites.map((s) => ({ id: s.id, name: s.name, url: s.url, desc: s.desc || "", iconName: s.icon || "Globe", categoryId: (s as any).categoryId })),
          ];
          const target = all.find((x) => x.id === favIds[n - 1]);
          if (target) {
            const u = target.url.startsWith("http") ? target.url : "https://" + target.url;
            recordVisit({ siteId: target.id, siteName: target.name, url: target.url, categoryId: (target as any).categoryId || (target as any).category });
            window.open(u, "_blank", "noopener,noreferrer");
            return;
          }
        }
        const all = [
          ...SITES.map((s) => ({ ...s, categoryId: s.category as string, desc: s.description })),
          ...customSites.map((s) => ({ id: s.id, name: s.name, url: s.url, desc: s.desc || "", iconName: s.icon || "Globe", categoryId: (s as any).categoryId })),
        ];
        const list = activeCat === "all" ? all : all.filter((s: any) => ((s as any).categoryId || s.category) === activeCat);
        openByIndex(list);
        return;
      }
      if (!typing && (e.key === "L" || e.key === "l")) { e.preventDefault(); toggle(); }
      if (!typing && (e.key === "T" || e.key === "t")) { e.preventDefault(); toggleTheme(); }
      if (!typing && (e.key === "[")) {
        e.preventDefault();
        const order = ["all", ...CATEGORIES.map((c) => c.key), ...customCats.map((c) => c.id)];
        const i = order.indexOf(activeCat);
        setCat(order[Math.max(i - 1, 0)]);
      }
      if (!typing && (e.key === "]")) {
        e.preventDefault();
        const order = ["all", ...CATEGORIES.map((c) => c.key), ...customCats.map((c) => c.id)];
        const i = order.indexOf(activeCat);
        setCat(order[Math.min(i + 1, order.length - 1)]);
      }
      if (!typing && (e.key === "P" || e.key === "p")) {
        e.preventDefault();
        if (unlocked) useUserStore.getState().lockPrivate();
        else {
          const p = prompt(locale === "zh" ? "输入隐私密码解锁" : "Enter privacy password");
          if (p) unlockPriv(p);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, toggleTheme, activeCat, setCat, unlocked, unlockPriv, locale, favOrder, favorites, customSites, customCats, recordVisit]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-ink">
      {/* 头部工具栏（360 风格：logo + 工具按钮 + 迷你天气 + 登录） */}
      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-glow-xs">
            <Icons.Share2 size={18} className="text-white" />
          </div>
          <span className="hidden text-[13px] font-semibold tracking-wide text-ink/80 sm:block">
            NavigatorHub · {t.appName}
          </span>
        </div>
        <HeaderActions />
      </header>

      {/* 单栏主体：搜索 → 收藏 → 内容 → 信息条 → 底部（首屏骨架由 index.html 承担，这里直接出内容） */}
      <div className="relative mx-auto flex w-full max-w-7xl flex-col">
        <SearchBlock />
        <FavoritesStrip />
        <ContentArea />
        <ContentCenter />
        <Suspense fallback={
          <div className="mx-auto w-full max-w-7xl px-4 pb-6 sm:px-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[150px] animate-pulse rounded-2xl border border-white/10 bg-white/5" />
              ))}
            </div>
          </div>
        }>
          <InfoStrip />
        </Suspense>
        <FooterActions />
      </div>

      {/* 全局弹层：命令面板 */}
      <Suspense fallback={null}>
        <CommandPalette />
      </Suspense>
      {/* 移动端下拉刷新 */}
      <Suspense fallback={null}>
        <PullToRefresh />
      </Suspense>
    </div>
  );
}
