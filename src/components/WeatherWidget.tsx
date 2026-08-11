import * as Icons from "lucide-react";
import { useI18n } from "@/i18n";
import { useWeather } from "@/hooks/useWeather";
import { resolveIcon } from "@/lib/icons";

function getIcon(name: string) {
  return resolveIcon(name, Icons.Sun);
}

/**
 * 天气组件（纯展示，数据来自 @/hooks/useWeather）
 * 不再自己管 fetch / 地理定位 / 兜底，全部交给 hook
 */
export default function WeatherWidget() {
  const { t } = useI18n();
  const { data, status, reload } = useWeather();

  if (status === "loading" || !data) {
    return (
      <div className="rounded-2xl border border-stroke bg-bg-elevate/50 p-4 backdrop-blur-sm shadow-glow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.CloudSun size={16} className="text-amber-400 animate-pulse" />
            <span className="text-[13px] font-semibold text-ink/80">{t.weather.title}</span>
          </div>
          <Icons.Loader2 size={14} className="animate-spin text-ink-muted" />
        </div>
        <div className="mt-3 h-20 rounded-xl bg-white/5" />
      </div>
    );
  }

  const MainIcon = getIcon((data.icon) || "Sun");
  return (
    <div className="rounded-2xl border border-stroke bg-bg-elevate/50 p-4 backdrop-blur-sm shadow-glow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icons.CloudSun size={16} className="text-amber-400" />
          <span className="text-[13px] font-semibold text-ink/80">{t.weather.title}</span>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-ink-muted">
            {data.city} · 更新 {data.updatedAt}
          </span>
        </div>
        <button onClick={() => reload()} className="rounded-lg p-1 text-ink-muted transition-colors hover:bg-white/5 hover:text-ink" title={t.common.refresh}>
          <Icons.RefreshCw size={14} />
        </button>
      </div>

      <div className="mt-3 flex items-start gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/5">
          <MainIcon size={34} className={data.isDay ? "text-amber-400" : "text-indigo-300"} />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-ink">{data.temp}</span>
            <span className="text-sm text-ink-muted">°C</span>
          </div>
          <p className="text-[13px] text-ink/80">{data.condition}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
            <span className="inline-flex items-center gap-0.5"><Icons.Droplets size={11} />{data.humidity}%</span>
            <span className="inline-flex items-center gap-0.5"><Icons.Wind size={11} />{data.windSpeed} km/h</span>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {data.forecast.map((d, i) => {
          const I = getIcon(d.icon);
          return (
            <div key={i} className="flex flex-col items-center gap-1 rounded-xl bg-white/5 p-2">
              <span className="text-[10px] text-ink-muted">{d.day}</span>
              <I size={16} className="text-amber-400" />
              <span className="text-[11px] font-semibold text-ink">{d.max}° / {d.min}°</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
