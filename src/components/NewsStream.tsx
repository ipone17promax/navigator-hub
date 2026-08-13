import * as Icons from "lucide-react";
import { useI18n } from "@/i18n";
import { useNews } from "@/hooks/useNews";

/**
 * 新闻速递（纯展示，数据来自 @/hooks/useNews）
 * hook 负责：数据源切换、自动滚动、暂停、加载状态、失败兜底
 */
export default function NewsStream() {
  const { t } = useI18n();
  const { items, loading, paused, setPaused, load, scrollerRef } = useNews(true);

  return (
    <div className="rounded-2xl border border-stroke bg-bg-elevate/50 p-4 backdrop-blur-sm shadow-glow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icons.Newspaper size={16} className="text-rose-400" />
          <span className="text-[13px] font-semibold text-ink/80">{t.news.title}</span>
          {!items.some((x) => x.updatedAt === "实时") || items.some((x) => x.source === "RSS") ? null : null}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setPaused(!paused)} className="rounded-lg p-1 text-ink-muted transition-colors hover:bg-white/5 hover:text-ink" title={paused ? t.common.play : t.common.pause}>
            {paused ? <Icons.Play size={14} /> : <Icons.Pause size={14} />}
          </button>
          <button onClick={() => load()} className="rounded-lg p-1 text-ink-muted transition-colors hover:bg-white/5 hover:text-ink" title={t.common.refresh}>
            <Icons.RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="mt-3 flex max-h-56 min-h-[12rem] flex-col gap-2 overflow-hidden pr-1 scroll-smooth"
      >
        {loading ? (
          <div className="flex flex-col gap-3 py-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl p-2">
                <div className="h-4 w-8 rounded-lg bg-white/5 animate-pulse" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="w-full h-2.5 rounded-md bg-white/5 animate-pulse" />
                  <div className="w-2/3 h-2 rounded-md bg-white/5 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {!loading && items.map((n, i) => (
          <a
            key={i}
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex cursor-pointer items-start gap-2 rounded-xl p-2 transition-colors hover:bg-white/5"
          >
            <span className="mt-0.5 inline-flex items-center justify-center rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-400 shrink-0">
              {n.category}
            </span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[12px] text-ink/80 transition-colors group-hover:text-ink">
                {n.title}
              </p>
              <p className="mt-0.5 text-[10px] text-ink-muted">
                {n.source} · {n.updatedAt}
              </p>
            </div>
            <Icons.ExternalLink size={11} className="mt-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-ink-muted" />
          </a>
        ))}
        {!loading && items.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-[11px] text-ink-muted">
            暂无新闻
          </div>
        ) : null}
      </div>
    </div>
  );
}
