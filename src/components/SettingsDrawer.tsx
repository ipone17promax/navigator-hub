import * as Icons from "@/lib/iconRegistry";
import { useI18n } from "@/i18n";
import { Suspense, lazy, useEffect, useState } from "react";

// 五个设置面板按需加载：首屏不下发，点开抽屉才拉对应 chunk
const BackgroundSwitcher = lazy(() => import("./BackgroundSwitcher"));
const ThemeSwitcher = lazy(() => import("./ThemeSwitcher"));
const DataSync = lazy(() => import("./DataSync"));
const StatsPanel = lazy(() => import("./StatsPanel"));
const CustomEditor = lazy(() => import("./CustomEditor"));

export type TabKey = "bg" | "theme" | "data" | "stats" | "custom";

function PanelSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
      <div className="h-10 w-full animate-pulse rounded-xl bg-white/5" />
      <div className="h-24 w-full animate-pulse rounded-xl bg-white/5" />
      <div className="h-10 w-2/3 animate-pulse rounded-xl bg-white/5" />
    </div>
  );
}

export default function SettingsDrawer({ open, initial = "bg", onClose }: { open: boolean; initial?: TabKey; onClose: () => void; }) {
  const [tab, setTab] = useState<TabKey>(initial);
  // 关闭动画（300ms）期间保持面板挂载，避免抽屉滑出时内容突然空白
  const [mounted, setMounted] = useState(open);
  const { t } = useI18n();
  useEffect(() => { setTab(initial); }, [initial, open]);
  useEffect(() => {
    if (open) { setMounted(true); return; }
    const id = window.setTimeout(() => setMounted(false), 320);
    return () => window.clearTimeout(id);
  }, [open]);

  const tabs: { k: TabKey; label: string; icon: Icons.LucideIcon }[] = [
    { k: "bg",     label: t.wallpaper, icon: Icons.Image },
    { k: "theme",  label: t.settings,  icon: Icons.Sliders },
    { k: "data",   label: t.data,      icon: Icons.Database },
    { k: "stats",  label: t.stats.title, icon: Icons.BarChart3 },
    { k: "custom", label: t.custom.title, icon: Icons.Edit3 },
  ];

  return (
    <div className={`fixed inset-0 z-50 transition-all duration-300 ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
      <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t.settings}
        aria-hidden={!open}
        className={`absolute right-0 top-0 flex h-full w-[min(96vw,440px)] flex-col border-l border-stroke bg-bg-base/95 shadow-2xl backdrop-blur-xl transition-transform duration-300 ${
          open ? "translate-x-0 visible" : "translate-x-full invisible"
        }`}
      >
        <header className="flex items-center gap-3 border-b border-stroke px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-glow">
            <Icons.Settings2 size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">{t.settings}</p>
            <p className="text-[11px] text-ink-subtle">Navigator Hub v3</p>
          </div>
          <button onClick={onClose} aria-label={t.close}
            className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-white/5 hover:text-ink">
            <Icons.X size={18} />
          </button>
        </header>
        <div className="flex gap-1 border-b border-stroke px-2 py-2 overflow-x-auto" role="tablist">
          {tabs.map((tt) => {
            const I = tt.icon ?? Icons.Sliders;
            const active = tab === tt.k;
            return (
              <button key={tt.k} onClick={() => setTab(tt.k)} role="tab" aria-selected={active}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                  active ? "bg-brand-gradient text-white shadow-glow" : "text-ink-muted hover:bg-white/5 hover:text-ink"
                }`}>
                <I size={13} /> {tt.label}
              </button>
            );
          })}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {mounted && (
            <Suspense fallback={<PanelSkeleton />}>
              {tab === "bg" && <BackgroundSwitcher />}
              {tab === "theme" && <ThemeSwitcher />}
              {tab === "data" && <DataSync />}
              {tab === "stats" && <StatsPanel />}
              {tab === "custom" && <CustomEditor />}
            </Suspense>
          )}
        </div>
      </aside>
    </div>
  );
}
