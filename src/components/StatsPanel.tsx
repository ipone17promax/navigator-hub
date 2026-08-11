import * as Icons from "lucide-react";
import { useI18n } from "@/i18n";
import { useUserStore } from "@/stores/useUserStore";

export default function StatsPanel() {
  const { t } = useI18n();
  const visits = useUserStore((s) => s.visits);
  const clear = useUserStore((s) => s.clearStats);

  const total = visits.reduce((a, b) => a + b.count, 0);
  const top = [...visits].sort((a, b) => b.count - a.count).slice(0, 8);
  const recent = [...visits].sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0)).slice(0, 5);
  const max = Math.max(1, ...top.map((v) => v.count));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient shadow-glow">
            <Icons.BarChart3 size={18} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">{t.stats.total}</p>
            <p className="text-2xl font-bold text-ink tabular-nums">{total.toLocaleString()}<span className="ml-1 text-sm font-medium text-ink-muted">{t.stats.visits}</span></p>
          </div>
        </div>
        <button onClick={() => clear()}
          className="inline-flex items-center gap-1 rounded-lg border border-stroke px-2.5 py-1.5 text-xs text-ink-muted transition-colors hover:bg-white/5 hover:text-ink">
          <Icons.Trash2 size={14} /> {t.stats.clear}
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-subtle">{t.stats.top}</p>
        {top.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stroke bg-white/[0.02] p-6 text-center text-xs text-ink-muted">{t.stats.noData}</div>
        ) : (
          <div className="space-y-2">
            {top.map((v, i) => (
              <div key={v.siteId} className="group flex items-center gap-3">
                <span className="w-6 text-right font-mono text-xs text-ink-subtle">{i + 1}</span>
                <div className="relative h-6 flex-1 overflow-hidden rounded-lg bg-white/5">
                  <div
                    className="h-full rounded-lg bg-brand-gradient transition-all duration-500 ease-out"
                    style={{ width: `${(v.count / max) * 100}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-3">
                    <span className="truncate text-[12px] font-medium text-ink drop-shadow">{v.siteName}</span>
                    <span className="shrink-0 text-[11px] text-white/90 tabular-nums drop-shadow">{v.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-subtle">{t.stats.recent}</p>
        {recent.length === 0 ? (
          <p className="text-xs text-ink-muted">—</p>
        ) : (
          <div className="space-y-1.5">
            {recent.map((v) => (
              <a key={v.siteId + v.lastAt}
                href={v.url.startsWith("http") ? v.url : "https://" + v.url}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-stroke bg-bg-elevate/40 px-3 py-1.5 text-xs transition-colors hover:bg-white/5">
                <span className="truncate text-ink-muted">{v.siteName}</span>
                <span className="shrink-0 font-mono text-ink-subtle">
                  {v.lastAt ? new Date(v.lastAt).toLocaleTimeString() : "—"}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
