import * as Icons from "lucide-react";
import { useUserStore, type HealthStatus } from "@/stores/useUserStore";
import { useI18n } from "@/i18n";
import { useEffect } from "react";
import { SITES } from "@/config/sites";

export function HealthBadge({ siteId }: { siteId: string }) {
  const h = useUserStore((s) => s.health[siteId]);
  const { t } = useI18n();
  if (!h) return null;
  const map: Record<HealthStatus, { color: string; icon: Icons.LucideIcon; label: string }> = {
    ok:      { color: "#34d399", icon: Icons.CheckCircle, label: t.health.ok },
    warn:    { color: "#fbbf24", icon: Icons.AlertTriangle, label: t.health.warn },
    err:     { color: "#f87171", icon: Icons.XCircle, label: t.health.err },
    unknown: { color: "#94a3b8", icon: Icons.HelpCircle, label: t.health.unknown },
  };
  const m = map[h.status];
  const I = m.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-1.5 py-0.5 text-[10px]"
      title={`${m.label} ${h.responseMs ? "· " + h.responseMs + "ms" : ""} ${t.health.lastCheck}: ${new Date(h.lastCheck).toLocaleString()}`}>
      <I size={10} style={{ color: m.color }} />
    </span>
  );
}

export function runHealthCheck(siteIds: string[]) {
  const patch: Record<string, any> = {};
  const done = useUserStore.getState();
  const now = Date.now();
  siteIds.forEach((id) => {
    patch[id] = { status: "checking" as any };
  });
  done.patchHealth(patch);

  const allSites = [
    ...SITES.map((s) => ({ id: s.id, url: s.url })),
    ...useUserStore.getState().customSites.map((s) => ({ id: s.id, url: s.url })),
  ];

  const tasks = allSites
    .filter((s) => siteIds.includes(s.id))
    .map(async (s) => {
      const t0 = performance.now();
      try {
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), 5000);
        // img ping 方式绕跨域，失败用 no-cors fetch
        let ms: number;
        let status: HealthStatus = "ok";
        try {
          await fetch(s.url, { mode: "no-cors", signal: ctrl.signal });
          clearTimeout(to);
          ms = Math.round(performance.now() - t0);
          if (ms > 2500) status = "warn";
        } catch {
          clearTimeout(to);
          ms = Math.round(performance.now() - t0);
          // 图片探测兜底
          status = await new Promise<HealthStatus>((resolve) => {
            const img = new Image();
            const t2 = setTimeout(() => resolve("warn"), 4500);
            img.onload = () => { clearTimeout(t2); resolve("ok"); };
            img.onerror = () => { clearTimeout(t2); resolve("err"); };
            try { img.src = s.url.replace(/\/$/, "") + "/favicon.ico"; }
            catch { resolve("err"); }
          });
        }
        useUserStore.getState().patchHealth({ [s.id]: { status, lastCheck: Date.now(), responseMs: ms } });
      } catch {
        useUserStore.getState().patchHealth({ [s.id]: { status: "err", lastCheck: Date.now() } });
      }
    });
  return Promise.all(tasks);
}

export function HighFreqBar({ onOpen }: { onOpen?: (url: string, info: { id: string; name: string; categoryId: string; url: string }) => void }) {
  const { t } = useI18n();
  const visits = useUserStore((s) => s.visits);
  const top = [...visits].sort((a, b) => b.count - a.count).slice(0, 6);
  if (top.length === 0) return null;
  return (
    <div className="mx-auto w-full max-w-[1200px] animate-fade-in-up" style={{ animationDelay: "60ms" }}>
      <div className="mb-2 flex items-center gap-2 px-1">
        <Icons.Flame size={14} className="text-orange-400" />
        <span className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">{t.recommend.freq}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {top.map((v, i) => (
          <button
            key={v.siteId}
            onClick={() => {
              window.open(v.url.startsWith("http") ? v.url : "https://" + v.url, "_blank", "noopener,noreferrer");
              useUserStore.getState().recordVisit({ siteId: v.siteId, siteName: v.siteName, url: v.url, categoryId: v.categoryId });
            }}
            className="group inline-flex items-center gap-2 rounded-full border border-stroke bg-bg-elevate/60 px-3 py-1.5 text-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-brand-primary hover:shadow-glow"
            style={{ animation: `fadeInUp .5s ${i * 50}ms both` }}
          >
            <span className="font-mono text-[10px] font-bold text-brand-primary">#{i + 1}</span>
            <span className="text-ink">{v.siteName}</span>
            <span className="text-[11px] text-ink-subtle">{v.count}{t.stats.visits}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
