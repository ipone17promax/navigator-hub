import * as Icons from "lucide-react";
import { useI18n } from "@/i18n";
import { useStocks } from "@/hooks/useStocks";

function sparklinePath(data: number[], box = { w: 80, h: 24, pad: 2 }): string {
  const len = data.length;
  if (len < 2) return "";
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  const span = hi - lo || 1;
  const stepX = (box.w - box.pad * 2) / (len - 1);
  return data
    .map((v, i) => {
      const x = box.pad + stepX * i;
      const y = box.h - box.pad - ((v - lo) / span) * (box.h - box.pad * 2);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function trend(changePct: number) {
  if (changePct > 0) return { color: "#ef4444", stroke: "#dc2626", arrow: "▲", cls: "text-rose-400" };
  if (changePct < 0) return { color: "#10b981", stroke: "#059669", arrow: "▼", cls: "text-emerald-400" };
  return { color: "#94a3b8", stroke: "#64748b", arrow: "=", cls: "text-ink-muted" };
}

/**
 * 股市行情组件（纯展示，数据来自 @/hooks/useStocks）
 * hook 负责：真实接口（东方财富 + sina）失败时的模拟数据、定时刷新、数量统计
 */
export default function StockWidget() {
  const { t } = useI18n();
  const { stocks, loading, loadAll, hasRealData } = useStocks();

  return (
    <div className="rounded-2xl border border-stroke bg-bg-elevate/50 p-4 backdrop-blur-sm shadow-glow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icons.TrendingUp size={16} className="text-emerald-400" />
          <span className="text-[13px] font-semibold text-ink/80">{t.stock.title}</span>
          {hasRealData ? (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">实时</span>
          ) : (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">示例</span>
          )}
        </div>
        <button onClick={() => loadAll()} className="rounded-lg p-1 text-ink-muted transition-colors hover:bg-white/5 hover:text-ink" title={t.common.refresh}>
          <Icons.RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {stocks.map((s, i) => {
          const td = trend(s.changePct);
          const d = sparklinePath(s.kline.map((k) => k.close));
          return (
            <a
              key={s.meta.code + i}
              href={s.meta.exUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex cursor-pointer flex-col gap-1 rounded-xl border border-stroke bg-bg-elevate/30 p-2.5 transition-all hover:border-stroke-hover hover:bg-white/5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-ink/80 truncate">{s.meta.name}</span>
                <span className={`text-[10px] font-semibold ${td.cls}`}>{td.arrow} {s.changePct.toFixed(2)}%</span>
              </div>
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className={`text-base font-bold leading-tight ${td.cls}`}>{s.price.toFixed(2)}</p>
                  <p className="text-[10px] text-ink-muted">昨收 {s.prevClose.toFixed(2)}</p>
                </div>
                <svg viewBox="0 0 80 24" preserveAspectRatio="none" className="h-6 w-[80px] shrink-0 overflow-visible">
                  <path d={d} stroke={td.stroke} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex items-center justify-between text-[10px] text-ink-muted">
                <span>开 {s.open.toFixed(2)}</span>
                <span>高 {s.high.toFixed(2)}</span>
                <span>低 {s.low.toFixed(2)}</span>
              </div>
              <span className="mt-0.5 text-right text-[10px] text-ink-muted">{s.lastUpdate}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
