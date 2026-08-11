import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { useI18n } from "@/i18n";
import GreetingClock from "@/components/GreetingClock";
import SearchHero from "@/components/SearchHero";
import CategoryTabs from "@/components/CategoryTabs";
import QuickTools from "@/components/QuickTools";
import SiteGrid from "@/components/SiteGrid";
import AppFooter from "@/components/AppFooter";
import BottomNavBar from "@/components/BottomNavBar";
import CommandPalette from "@/components/CommandPalette";
import { HighFreqBar } from "@/components/HealthAndFreq";
import SettingsDrawer from "@/components/SettingsDrawer";
import WeatherWidget from "@/components/WeatherWidget";
import MiniCalendar from "@/components/MiniCalendar";
import NewsStream from "@/components/NewsStream";
import StockWidget from "@/components/StockWidget";
import FeaturedHighlights from "@/components/FeaturedHighlights";
import FontSizeToggle from "@/components/FontSizeToggle";
import LoginCard from "@/components/LoginCard";
import SearchTabs from "@/components/SearchTabs";
import { useAppStore } from "@/stores/useAppStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { SITES, CATEGORIES } from "@/config/sites";
import { useUserStore } from "@/stores/useUserStore";

export default function HomePage() {
  const { t, toggle, toggleTheme, locale } = useI18n();
  const [loaded, setLoaded] = useState(false);
  const authStatus = useAuthStore((s) => s.status);
  const setCat = useAppStore((s) => s.setActiveCategoryId);
  const activeCat = useAppStore((s) => s.activeCategoryId);
  const customSites = useUserStore((s) => s.customSites);
  const customCats = useUserStore((s) => s.customCats);
  const recordVisit = useUserStore((s) => s.recordVisit);
  const favorites = useUserStore((s) => s.favorites);
  const favOrder = useUserStore((s) => s.favoriteOrder);
  const unlockPriv = useUserStore((s) => s.unlockPrivate);
  const unlocked = useUserStore((s) => s.privateUnlocked);

  const [drawer, setDrawer] = useState<{ open: boolean; tab: "bg" | "theme" | "data" | "stats" | "custom" }>({ open: false, tab: "bg" });
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLoaded(true), 400);
    return () => clearTimeout(t1);
  }, []);

  // 快捷键：全局监听
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;

      // Cmd+K / Ctrl+K：打开命令面板
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        useAppStore.getState().toggleCommandPalette();
        return;
      }

      // 数字键 1-9：打开当前分类或收藏中的站点
      if (!typing && /^[1-9]$/.test(e.key)) {
        const n = parseInt(e.key, 10);
        e.preventDefault();
        const favIds = [...favOrder.filter((x) => favorites.includes(x)), ...favorites.filter((x) => !favOrder.includes(x))];
        const openByIndex = (list: any[]) => {
          const s = list[n - 1];
          if (!s) return;
          const u = s.url.startsWith("http") ? s.url : "https://" + s.url;
          recordVisit({ siteId: s.id, siteName: s.name, url: s.url, categoryId: s.categoryId || (s as any).category });
          window.open(u, "_blank", "noopener,noreferrer");
        };
        // 如果有收藏区且够数，优先打开收藏
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
        // 否则打开当前分类的第 n 个
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
  }, [activeCat, customCats, customSites, favorites, favOrder, recordVisit, setCat, toggle, toggleTheme, unlocked, unlockPriv, locale]);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden text-ink">
      {/* 头部：品牌区 + 快捷动作 */}
      <header className="relative z-20 px-5 pt-8">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-2 rounded-2xl bg-brand-gradient opacity-30 blur-xl animate-pulse-glow" />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow">
                <Icons.Share2 size={20} className="text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold text-brand-gradient">{t.appName}</h1>
                {authStatus === "admin" ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                    <Icons.ShieldCheck size={10} /> {t.adminBadge}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                    <Icons.UserX size={10} /> {t.guestBadge}
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-subtle">{t.brandSub}</p>
            </div>
          </div>

          <div className="hidden items-center gap-1 md:flex">
            <button onClick={toggle}
              className="inline-flex items-center gap-1 rounded-xl border border-stroke bg-bg-elevate/60 px-3 py-2 text-xs font-semibold text-ink-muted backdrop-blur transition-colors hover:border-stroke-hover hover:text-ink">
              <Icons.Languages size={14} /> {locale === "zh" ? "EN" : "中"}
            </button>
            <button onClick={toggleTheme}
              className="inline-flex items-center gap-1 rounded-xl border border-stroke bg-bg-elevate/60 px-3 py-2 text-ink-muted backdrop-blur transition-colors hover:border-stroke-hover hover:text-ink"
              title={t.theme.title}>
              <Icons.Moon size={14} />
            </button>
            <button onClick={() => setDrawer({ open: true, tab: "bg" })}
              className="inline-flex items-center gap-1 rounded-xl border border-stroke bg-bg-elevate/60 px-3 py-2 text-ink-muted backdrop-blur transition-colors hover:border-stroke-hover hover:text-ink"
              title={t.bg.title}>
              <Icons.Palette size={14} />
            </button>
            <button onClick={() => setDrawer({ open: true, tab: "stats" })}
              className="inline-flex items-center gap-1 rounded-xl border border-stroke bg-bg-elevate/60 px-3 py-2 text-ink-muted backdrop-blur transition-colors hover:border-stroke-hover hover:text-ink"
              title={t.stats.title}>
              <Icons.BarChart3 size={14} />
            </button>
            <button onClick={() => setDrawer({ open: true, tab: "custom" })}
              className="inline-flex items-center gap-1 rounded-xl border border-stroke bg-bg-elevate/60 px-3 py-2 text-ink-muted backdrop-blur transition-colors hover:border-stroke-hover hover:text-ink"
              title={t.custom.title}>
              <Icons.FolderPlus size={14} />
            </button>
            <button onClick={() => setDrawer({ open: true, tab: "data" })}
              className="inline-flex items-center gap-1 rounded-xl border border-stroke bg-bg-elevate/60 px-3 py-2 text-ink-muted backdrop-blur transition-colors hover:border-stroke-hover hover:text-ink"
              title={t.sync.title}>
              <Icons.CloudCog size={14} />
            </button>
            <FontSizeToggle />
            {authStatus !== "admin" && (
              <button onClick={() => setShowLogin(true)}
                className="inline-flex items-center gap-1 rounded-xl border border-stroke bg-bg-elevate/60 px-3 py-2 text-ink-muted backdrop-blur transition-colors hover:border-stroke-hover hover:text-ink"
                title="管理员登录">
                <Icons.LogIn size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 加载屏 */}
      {!loaded && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-bg-base">
          <div className="flex flex-col items-center gap-4 animate-fade-in-up">
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-brand-gradient opacity-40 blur-2xl animate-pulse-glow" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow-lg">
                <Icons.Share2 size={30} className="text-white" />
              </div>
            </div>
            <p className="text-sm text-ink-muted">{t.loading}</p>
            <div className="h-1 w-40 overflow-hidden rounded-full bg-white/5">
              <div className="h-full w-1/3 animate-indeterminate bg-brand-gradient" />
            </div>
          </div>
        </div>
      )}

      <main className="relative z-10 flex flex-col gap-10 px-5 pb-32 pt-10">
        <GreetingClock />
        <SearchHero />
        <SearchTabs />
        <FeaturedHighlights />
        <HighFreqBar />
        <QuickTools />
        {/* 信息面板：天气 + 日历 + 行情 + 新闻 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <WeatherWidget />
          <MiniCalendar />
          <StockWidget />
          <NewsStream />
        </div>
        <CategoryTabs onOpenEdit={() => setDrawer({ open: true, tab: "custom" })} />
        <SiteGrid />
        <AppFooter />
      </main>

      <BottomNavBar
        onOpenBg={() => setDrawer({ open: true, tab: "bg" })}
        onOpenTheme={() => setDrawer({ open: true, tab: "theme" })}
        onOpenSync={() => setDrawer({ open: true, tab: "data" })}
        onOpenStats={() => setDrawer({ open: true, tab: "stats" })}
        onOpenCustom={() => setDrawer({ open: true, tab: "custom" })}
      />

      <CommandPalette />
      <SettingsDrawer open={drawer.open} initial={drawer.tab} onClose={() => setDrawer((s) => ({ ...s, open: false }))} />
      {showLogin && <LoginCard onClose={() => setShowLogin(false)} />}
    </div>
  );
}
