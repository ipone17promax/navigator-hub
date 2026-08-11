import * as Icons from "lucide-react";
import { useI18n } from "@/i18n";
import { useEffect, useState } from "react";
import BackgroundSwitcher from "./BackgroundSwitcher";
import DataSync from "./DataSync";
import StatsPanel from "./StatsPanel";
import CustomEditor from "./CustomEditor";
import ThemeSwitcher from "./ThemeSwitcher";

export type TabKey = "bg" | "theme" | "data" | "stats" | "custom";

export default function SettingsDrawer({ open, initial = "bg", onClose }: { open: boolean; initial?: TabKey; onClose: () => void; }) {
  const [tab, setTab] = useState<TabKey>(initial);
  const { t } = useI18n();
  useEffect(() => { setTab(initial); }, [initial, open]);

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
        className={`absolute right-0 top-0 flex h-full w-[min(96vw,440px)] flex-col border-l border-stroke bg-bg-base/95 shadow-2xl backdrop-blur-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
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
          <button onClick={onClose} className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-white/5 hover:text-ink">
            <Icons.X size={18} />
          </button>
        </header>
        <div className="flex gap-1 border-b border-stroke px-2 py-2 overflow-x-auto">
          {tabs.map((tt) => {
            const I = tt.icon ?? Icons.Sliders;
            const active = tab === tt.k;
            return (
              <button key={tt.k} onClick={() => setTab(tt.k)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                  active ? "bg-brand-gradient text-white shadow-glow" : "text-ink-muted hover:bg-white/5 hover:text-ink"
                }`}>
                <I size={13} /> {tt.label}
              </button>
            );
          })}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {tab === "bg" && <BackgroundSwitcher />}
          {tab === "theme" && <ThemeSwitcher />}
          {tab === "data" && <DataSync />}
          {tab === "stats" && <StatsPanel />}
          {tab === "custom" && <CustomEditor />}
        </div>
      </aside>
    </div>
  );
}
