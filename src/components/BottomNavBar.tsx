import { useRef } from "react";
import * as Icons from "lucide-react";
import { useAppStore } from "@/stores/useAppStore";
import { useI18n } from "@/i18n";
import { Link, useLocation } from "react-router-dom";
import { useUserStore } from "@/stores/useUserStore";

interface NavItem { path: string; key: "home" | "storm" | "binary" | "morse" | "clock"; icon: Icons.LucideIcon; }

const items: NavItem[] = [
  { path: "/",             key: "home",   icon: Icons.Home },
  { path: "/storm-tracker",key: "storm",  icon: Icons.CloudLightning },
  { path: "/binary-parser",key: "binary", icon: Icons.Binary },
  { path: "/morse-code",   key: "morse",  icon: Icons.Radio },
  { path: "/compass-clock",key: "clock",  icon: Icons.Compass },
];

interface Props {
  onOpenBg?: () => void;
  onOpenTheme?: () => void;
  onOpenSync?: () => void;
  onOpenStats?: () => void;
  onOpenCustom?: () => void;
}

export default function BottomNavBar({ onOpenBg, onOpenTheme, onOpenSync, onOpenStats, onOpenCustom }: Props) {
  const { t, toggle, toggleTheme, locale } = useI18n();
  const location = useLocation();
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const setCat = useAppStore((s) => s.setActiveCategoryId);
  const openCmd = useAppStore((s) => s.openCommandPalette);
  const unlocked = useUserStore((s) => s.privateUnlocked);
  const lockPriv = useUserStore((s) => s.lockPrivate);

  return (
    <nav
      className="pointer-events-auto fixed bottom-3 left-1/2 z-40 w-[min(96vw,640px)] -translate-x-1/2 animate-slide-up"
      onTouchStart={(e) => {
        const t = e.touches[0];
        touchStart.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        if (!touchStart.current) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - touchStart.current.x;
        const dy = t.clientY - touchStart.current.y;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          const order = ["all", "dev", "design", "study", "life", "ai", "tools"];
          const cur = useAppStore.getState().activeCategoryId;
          const idx = order.indexOf(cur);
          if (dx < 0) setCat(order[Math.min(idx + 1, order.length - 1)]);
          else setCat(Math.max(idx - 1, 0) >= 0 ? order[Math.max(idx - 1, 0)] : order[0]);
        }
        touchStart.current = null;
      }}
    >
      <div className="flex items-center justify-between gap-1 rounded-2xl border border-stroke bg-bg-base/80 px-1.5 py-1.5 shadow-card backdrop-blur-xl">
        <button onClick={() => openCmd()}
          className="flex h-10 w-10 flex-col items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
          title="Cmd+K">
          <Icons.Command size={18} />
        </button>

        <div className="flex items-center gap-0.5">
          {items.map((it) => {
            const I = it.icon;
            const active = location.pathname === it.path;
            return (
              <Link
                key={it.path}
                to={it.path}
                className={`flex h-10 w-12 flex-col items-center justify-center rounded-xl transition-all duration-300 ${
                  active ? "bg-brand-gradient text-white shadow-glow scale-105" : "text-ink-muted hover:bg-white/5 hover:text-ink"
                }`}
                title={t.nav[it.key]}
              >
                <I size={18} />
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-0.5">
          {unlocked && (
            <button onClick={() => lockPriv()}
              className="flex h-10 w-10 flex-col items-center justify-center rounded-xl text-emerald-400 transition-colors hover:bg-white/5"
              title={t.user.lockPrivate}>
              <Icons.Unlock size={16} />
            </button>
          )}
          <button onClick={onOpenStats}
            className="flex h-10 w-10 flex-col items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
            title={t.stats.title}>
            <Icons.BarChart3 size={16} />
          </button>
          <button onClick={onOpenBg}
            className="flex h-10 w-10 flex-col items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
            title={t.bg.title}>
            <Icons.Palette size={16} />
          </button>
          <button onClick={onOpenCustom}
            className="flex h-10 w-10 flex-col items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
            title={t.custom.title}>
            <Icons.FolderPlus size={16} />
          </button>
          <button onClick={onOpenSync}
            className="flex h-10 w-10 flex-col items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
            title={t.sync.title}>
            <Icons.Repeat size={16} />
          </button>
          <button onClick={onOpenTheme}
            className="flex h-10 w-10 flex-col items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
            title={t.settings}>
            <Icons.Settings size={16} />
          </button>
          <button onClick={toggleTheme}
            className="hidden h-10 w-10 flex-col items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-white/5 hover:text-ink md:flex"
            title={t.theme.title}>
            <Icons.Moon size={16} />
          </button>
          <button onClick={toggle}
            className="flex h-10 min-w-10 items-center justify-center rounded-xl px-2 text-xs font-bold text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
            title={t.language}>
            {locale === "zh" ? "EN" : "中"}
          </button>
        </div>
      </div>
    </nav>
  );
}
