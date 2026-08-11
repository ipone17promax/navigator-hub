import { useMemo } from "react";
import * as Icons from "lucide-react";
import { useUserStore } from "@/stores/useUserStore";
import { SITES } from "@/config/sites";
import { useI18n } from "@/i18n";

function timeAgo(ts: number, locale: string): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return locale === "zh" ? "刚刚" : "just now";
  if (min < 60) return locale === "zh" ? `${min}分钟前` : `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return locale === "zh" ? `${hr}小时前` : `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return locale === "zh" ? `${day}天前` : `${day}d ago`;
}

export default function StatsPanel() {
  const { t, locale } = useI18n();
  const { visitStats, clearStats } = useUserStore();

  const siteMap = useMemo(() => {
    const map: Record<string, (typeof SITES)[number]> = {};
    for (const s of SITES) map[s.id] = s;
    return map;
  }, []);

  const topSites = useMemo(() => {
    return Object.values(visitStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [visitStats]);

  const totalVisits = useMemo(
    () => Object.values(visitStats).reduce((sum, r) => sum + r.count, 0),
    [visitStats],
  );

  const recentSites = useMemo(() => {
    return Object.values(visitStats)
      .sort((a, b) => b.lastVisit - a.lastVisit)
      .slice(0, 5);
  }, [visitStats]);

  if (totalVisits === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center gap-3 py-12 text-center animate-fade-in-up">
        <Icons.BarChart3 size={40} className="text-ink-subtle" strokeWidth={1.25} />
        <p className="text-sm text-ink-muted">{t.statsNoData}</p>
      </div>
    );
  }

  const maxCount = topSites[0]?.count ?? 1;

  return (
    <div className="glass-card p-5 animate-fade-in-up">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icons.BarChart3 size={16} className="text-brand-primary" />
          <span className="text-sm font-semibold text-ink">{t.statsTitle}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-brand-gradient/20 px-3 py-1 text-xs text-brand-primary">
            <Icons.MousePointerClick size={12} />
            <span className="font-semibold">{totalVisits}</span>
            <span className="opacity-70">{t.statsVisits}</span>
          </div>
          <button
            onClick={clearStats}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-ink-subtle transition-colors hover:text-red-400"
            title={t.statsClear}
          >
            <Icons.Trash2 size={11} />
            {t.statsClear}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div>
          <p className="mb-2.5 text-xs font-medium text-ink-muted">{t.statsTopSites}</p>
          <div className="space-y-2">
            {topSites.map((rec, idx) => {
              const site = siteMap[rec.siteId];
              if (!site) return null;
              const pct = (rec.count / maxCount) * 100;
              return (
                <a
                  key={rec.siteId}
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2.5"
                  title={`${site.name} · ${rec.count} ${t.statsVisits}`}
                >
                  <span className="w-5 text-right text-[11px] font-mono text-ink-subtle">
                    {idx + 1}
                  </span>
                  <span
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
                    style={{ background: `${site.accent}22`, color: site.accent }}
                  >
                    {site.name.charAt(0)}
                  </span>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate text-ink group-hover:text-brand-primary">
                        {site.name}
                      </span>
                      <span className="ml-2 flex-shrink-0 font-mono text-ink-muted">
                        {rec.count}
                      </span>
                    </div>
                    <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${site.accent}, ${site.accent}88)`,
                        }}
                      />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2.5 text-xs font-medium text-ink-muted">{t.statsRecent}</p>
          <div className="space-y-1.5">
            {recentSites.map((rec) => {
              const site = siteMap[rec.siteId];
              if (!site) return null;
              return (
                <a
                  key={rec.siteId}
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
                >
                  <span
                    className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{ background: site.accent }}
                  />
                  <span className="flex-1 truncate text-xs text-ink group-hover:text-brand-primary">
                    {site.name}
                  </span>
                  <span className="flex-shrink-0 text-[10px] text-ink-subtle">
                    {rec.count} {t.statsVisits}
                  </span>
                  <span className="flex-shrink-0 text-[10px] text-ink-subtle">
                    {timeAgo(rec.lastVisit, locale)}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
