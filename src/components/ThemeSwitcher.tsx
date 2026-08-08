import { useAppStore } from "@/stores/useAppStore";
import { THEME_ORDER, THEMES } from "@/config/themes";
import type { ThemeKey } from "@/shared/types";

/**
 * 右上角主题切换器：3 个彩色圆点
 */
export default function ThemeSwitcher() {
  const activeTheme = useAppStore((s) => s.activeTheme);
  const setActiveTheme = useAppStore((s) => s.setActiveTheme);

  return (
    <div className="flex items-center gap-2 rounded-full border border-stroke bg-bg-elevate/70 p-1.5 backdrop-blur-md animate-fade-in-up">
      <span className="hidden pl-2 pr-1 text-xs text-ink-muted sm:inline-block">主题</span>
      {THEME_ORDER.map((key: ThemeKey, idx) => {
        const t = THEMES[key];
        const isActive = activeTheme === key;
        return (
          <button
            key={key}
            type="button"
            aria-label={`切换到${t.name}主题`}
            title={t.name}
            onClick={() => setActiveTheme(key)}
            style={{
              animationDelay: `${idx * 60}ms`,
            }}
            className="group relative flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 animate-fade-in-up"
          >
            <span
              className={`block h-5 w-5 rounded-full transition-all duration-300 ${
                isActive ? "ring-2 ring-white/90 ring-offset-2 ring-offset-bg-base scale-110" : ""
              }`}
              style={{ background: t.dot }}
            />
            {/* 悬浮提示 */}
            <span className="pointer-events-none absolute -bottom-9 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md border border-stroke bg-bg-base/90 px-2 py-1 text-xs text-ink-muted opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
              {t.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
