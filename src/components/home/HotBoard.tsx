import * as Icons from "@/lib/iconRegistry";
import { useI18n } from "@/i18n";
import { useHot } from "@/hooks/useHot";
import { useDaily } from "@/hooks/useDaily";

const SOURCE_ACCENT: Record<string, string> = {
  weibo: "#E6162D",
  zhihu: "#0066FF",
  github: "#A78BFA",
};

/**
 * 内容卡片：优先热榜，全部源不可达时回退到「每日 60 秒简报」
 * 两者都失败则整卡隐藏，不占布局
 */
export default function HotBoard() {
  const { t, locale } = useI18n();
  const hot = useHot();
  const daily = useDaily();

  const showHot = hot.status === "ok" && hot.items.length > 0;
  const showDaily = !showHot && daily.status === "ok" && !!daily.data;
  if (!showHot && !showDaily) return null;

  const reload = () => {
    hot.reload();
    daily.reload();
  };

  return (
    <div className="w-full rounded-2xl border border-stroke bg-bg-elevate/50 p-4 backdrop-blur-sm shadow-glow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icons.Flame size={16} className={showHot ? "text-orange-400" : "text-sky-400"} />
          <span className="text-[13px] font-semibold text-ink/80">
            {showHot ? t.hot.title : t.daily.title}
          </span>
          {showDaily && daily.data?.date && (
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-ink-muted">
              {daily.data.date}
            </span>
          )}
        </div>
        <button
          onClick={reload}
          className="rounded-lg p-1 text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
          title={t.common.refresh}
        >
          <Icons.RefreshCw size={14} />
        </button>
      </div>

      {showHot ? (
        <div className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {hot.items.map((it, i) => (
            <a
              key={it.url + i}
              href={it.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/5"
              title={it.title}
            >
              <span
                className="w-5 shrink-0 text-center text-[11px] font-bold"
                style={{ color: i < 3 ? "#F59E0B" : "var(--ink-subtle, #8b96ab)" }}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-[12px] text-ink/80 group-hover:text-ink">
                {it.title}
              </span>
              <span
                className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px]"
                style={{
                  color: SOURCE_ACCENT[it.source] ?? "#8b96ab",
                  border: `1px solid ${(SOURCE_ACCENT[it.source] ?? "#8b96ab") + "55"}`,
                }}
              >
                {locale === "en" ? it.source : it.sourceName}
              </span>
            </a>
          ))}
        </div>
      ) : (
        <div className="mt-2 grid gap-1 sm:grid-cols-2">
          {daily.data?.news.map((n, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
              title={n}
            >
              <span className="mt-0.5 w-5 shrink-0 text-right text-[11px] font-bold text-sky-400/80">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 text-[12px] leading-relaxed text-ink/75">{n}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}