import { useEffect, useMemo, useRef } from "react";
import * as Icons from "@/lib/iconRegistry";
import { useI18n } from "@/i18n";
import { useFlashNews } from "@/hooks/useFlashNews";
import { SITES } from "@/config/sites";
import { EDITORIAL_LINKS, EDITORIAL_TIPS } from "@/config/editorial";
import { resolveIcon } from "@/lib/icons";

const QUOTES: { text: string; from: string }[] = [
  { text: "慢慢来，比较快。", from: "佚名" },
  { text: "把复杂留给自己，把简单留给别人。", from: "工程手记" },
  { text: "不要因为走得太远，忘记为什么出发。", from: "纪伯伦" },
  { text: "真正的效率，是少做无用的事。", from: "佚名" },
  { text: "知道自己在做什么，比做得快更重要。", from: "佚名" },
  { text: "所有捷径，最后都绕回了基本功。", from: "佚名" },
  { text: "先把一件事做完，再谈做好。", from: "佚名" },
  { text: "工具会变，判断力不会过期。", from: "佚名" },
  { text: "写作是思考的显影液。", from: "佚名" },
  { text: "世界会给专注的人让路。", from: "佚名" },
  { text: "你不需要更多工具，你需要更少干扰。", from: "佚名" },
  { text: "每天进步一点点，一年后就是另一个自己。", from: "佚名" },
  { text: "看不懂的先跳过，走完一遍再回头。", from: "佚名" },
  { text: "热爱不是冲动，是重复之后仍然愿意。", from: "佚名" },
  { text: "把时间花在会复利的事情上。", from: "佚名" },
  { text: "答案在做的过程中长出来。", from: "佚名" },
];

function formatHot(n: number): string {
  if (!n) return "";
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, "") + "万";
  return String(n);
}

/**
 * 内容中心：今日快讯 + 微博热搜 + 每日一句 + 今日推荐
 *   - 进入视口才请求，减少首屏开销
 *   - 失败时显示重试，不伪造数据
 */
export default function ContentCenter() {
  const { t, locale } = useI18n();
  const { flash, hot, date, loading, err, load } = useFlashNews();
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      void load();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void load();
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [load]);

  const dayIndex = Math.floor(Date.now() / 86400000);
  const quote = QUOTES[dayIndex % QUOTES.length];
  const picks = useMemo(() => {
    const pool = SITES.filter((s) => s.category !== "search");
    const start = dayIndex % Math.max(pool.length, 1);
    return [0, 1, 2].map((i) => pool[(start + i * 7) % pool.length]).filter(Boolean);
  }, [dayIndex]);

  return (
    <section ref={ref} className="relative z-10 px-4 pb-4 sm:px-6">
      <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-3">
        {/* 今日快讯 */}
        <div className="rounded-2xl border border-stroke bg-bg-elevate/50 p-4 backdrop-blur-sm shadow-glow-xs lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icons.Zap size={16} className="text-amber-400" />
              <span className="text-[13px] font-semibold text-ink/80">{t.content.flash}</span>
              {date && <span className="text-[10px] text-ink-subtle">{date}</span>}
              {err && flash.length === 0 && (
                <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-500">
                  {t.content.fallback}
                </span>
              )}
            </div>
            <button
              onClick={() => void load(true)}
              title={t.common.refresh}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
            >
              <Icons.RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* 固定内容区高度：骨架 → 真实数据时页面下方不再整体上下位移 */}
          <div className="min-h-[18rem]">
          {loading && flash.length === 0 ? (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-2.5 rounded-md bg-white/5 animate-pulse" style={{ width: `${90 - i * 6}%` }} />
              ))}
            </div>
          ) : err && flash.length === 0 ? (
            <div>
              <p className="mb-2 text-[11px] text-ink-muted">{t.content.fallbackHint}</p>
              <ol className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                {EDITORIAL_TIPS.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 rounded-lg px-1 py-1 text-[12px] leading-relaxed text-ink/80">
                    <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-amber-500/15 text-[10px] font-bold text-amber-500">
                      {i + 1}
                    </span>
                    <span className="line-clamp-3">{item}</span>
                  </li>
                ))}
              </ol>
              <button
                onClick={() => void load(true)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-stroke px-3 py-1.5 text-xs text-ink hover:bg-white/5"
              >
                <Icons.RefreshCw size={12} className={loading ? "animate-spin" : ""} /> {t.content.retry}
              </button>
            </div>
          ) : (
            <ol className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
              {flash.map((item, i) => (
                <li key={i} className="flex items-start gap-2 rounded-lg px-1 py-1 text-[12px] leading-relaxed text-ink/80">
                  <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-amber-500/15 text-[10px] font-bold text-amber-500">
                    {i + 1}
                  </span>
                  <span className="line-clamp-3">{item}</span>
                </li>
              ))}
            </ol>
          )}
          </div>
        </div>

        {/* 微博热搜 */}
        <div className="rounded-2xl border border-stroke bg-bg-elevate/50 p-4 backdrop-blur-sm shadow-glow-xs">
          <div className="mb-3 flex items-center gap-2">
            <Icons.Flame size={16} className="text-rose-400" />
            <span className="text-[13px] font-semibold text-ink/80">{t.content.hot}</span>
            <span className="ml-auto text-[10px] text-ink-subtle">{t.content.hotFrom}</span>
          </div>
          <div className="min-h-[18rem]">
          {loading && hot.length === 0 ? (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-2.5 rounded-md bg-white/5 animate-pulse" style={{ width: `${88 - i * 7}%` }} />
              ))}
            </div>
          ) : (
            <ol className="max-h-80 space-y-0.5 overflow-y-auto pr-1">
              {hot.slice(0, 12).map((item, i) => (
                <li key={item.title + i}>
                  <a
                    href={item.link || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 rounded-lg px-1 py-1.5 transition-colors hover:bg-white/5"
                  >
                    <span
                      className={`inline-flex w-4 shrink-0 justify-center text-[11px] font-bold ${
                        i < 3 ? "text-rose-400" : "text-ink-subtle"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12px] text-ink/80 group-hover:text-ink">{item.title}</span>
                    {item.hot > 0 && <span className="shrink-0 text-[10px] text-ink-subtle">{formatHot(item.hot)}</span>}
                  </a>
                </li>
              ))}
              {hot.length === 0 && (
                <>
                  {EDITORIAL_LINKS.map((item, i) => (
                    <li key={item.title}>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 rounded-lg px-1 py-1.5 transition-colors hover:bg-white/5"
                      >
                        <span className="inline-flex w-4 shrink-0 justify-center text-[11px] font-bold text-ink-subtle">
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[12px] text-ink/80 group-hover:text-ink">{item.title}</span>
                      </a>
                    </li>
                  ))}
                  <li className="pt-1 text-center text-[10px] text-ink-subtle">{t.content.fallback}</li>
                </>
              )}
              {hot.length === 0 && !err && (
                <li className="py-6 text-center text-[11px] text-ink-muted">{t.content.empty}</li>
              )}
            </ol>
          )}
          </div>
        </div>

        {/* 每日一句 + 今日推荐 */}
        <div className="grid gap-4 rounded-2xl border border-stroke bg-bg-elevate/50 p-4 backdrop-blur-sm shadow-glow-xs md:grid-cols-2 lg:col-span-3">
          <div className="flex flex-col justify-center border-stroke md:border-r md:pr-5">
            <div className="mb-1.5 flex items-center gap-2">
              <Icons.Quote size={14} className="text-purple-400" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-subtle">{t.content.quote}</span>
            </div>
            <p className="font-display text-[15px] leading-relaxed text-ink">{quote.text}</p>
            <p className="mt-1 text-[11px] text-ink-muted">— {quote.from}</p>
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Icons.Compass size={14} className="text-cyan-400" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-subtle">{t.content.picks}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {picks.map((s) => {
                const I = resolveIcon(s.iconName, Icons.Globe);
                return (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-white/5"
                  >
                    <I size={13} style={{ color: s.accent }} className="shrink-0" />
                    <span className="truncate text-[12px] text-ink/80 group-hover:text-ink">{locale === "en" && s.nameEn ? s.nameEn : s.name}</span>
                    <span className="ml-auto hidden shrink-0 text-[10px] text-ink-subtle sm:block">{locale === "en" && s.descriptionEn ? s.descriptionEn : s.description}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
