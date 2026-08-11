import { useState } from "react";
import * as Icons from "lucide-react";
import { useI18n } from "@/i18n";
import FontSizeToggle from "@/components/FontSizeToggle";
import LoginCard from "@/components/LoginCard";
import WeatherMini from "./WeatherMini";
import SettingsDrawer, { type TabKey } from "@/components/SettingsDrawer";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * 360 风格顶部工具栏（右侧一组按钮，不做搜索）
 * 按钮顺序：语言、主题、背景、统计、自定义、数据同步、字号、登录
 */
export default function HeaderActions() {
  const { t, toggle, toggleTheme } = useI18n();
  const authStatus = useAuthStore((s) => s.status);
  const [drawer, setDrawer] = useState<{ open: boolean; tab: TabKey }>({ open: false, tab: "bg" });
  const [showLogin, setShowLogin] = useState(false);

  type Btn = {
    onClick: () => void;
    icon: Icons.LucideIcon;
    title: string;
  };
  const left: Btn[] = [
    { onClick: () => toggle(), icon: Icons.Languages, title: t.language },
    { onClick: () => toggleTheme(), icon: Icons.Moon, title: t.theme.title },
    { onClick: () => setDrawer({ open: true, tab: "bg" }), icon: Icons.Palette, title: t.bg.title },
    { onClick: () => setDrawer({ open: true, tab: "stats" }), icon: Icons.BarChart3, title: t.stats.title },
    { onClick: () => setDrawer({ open: true, tab: "custom" }), icon: Icons.FolderPlus, title: t.custom.title },
    { onClick: () => setDrawer({ open: true, tab: "data" }), icon: Icons.CloudCog, title: t.sync.title },
  ];

  return (
    <>
      <div className="flex items-center gap-2">
        {left.map((b, i) => {
          const I = b.icon;
          return (
            <button
              key={i}
              onClick={b.onClick}
              title={b.title}
              className="inline-flex items-center gap-1 rounded-xl border border-stroke bg-bg-elevate/60 px-3 py-2 text-ink-muted backdrop-blur transition-colors hover:border-stroke-hover hover:text-ink"
            >
              <I size={14} />
            </button>
          );
        })}
        <WeatherMini />
        <FontSizeToggle />
        {authStatus !== "admin" && (
          <button
            onClick={() => setShowLogin(true)}
            title="管理员登录"
            className="inline-flex items-center gap-1 rounded-xl border border-stroke bg-bg-elevate/60 px-3 py-2 text-ink-muted backdrop-blur transition-colors hover:border-stroke-hover hover:text-ink"
          >
            <Icons.LogIn size={14} />
          </button>
        )}
      </div>
      <SettingsDrawer open={drawer.open} initial={drawer.tab}
        onClose={() => setDrawer((d) => ({ ...d, open: false }))} />
      {showLogin && <LoginCard onClose={() => setShowLogin(false)} />}
    </>
  );
}
