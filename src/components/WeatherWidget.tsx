import { useState, type FormEvent } from "react";
import * as Icons from "@/lib/iconRegistry";
import { useI18n } from "@/i18n";
import { useWeather } from "@/hooks/useWeather";
import { resolveIcon } from "@/lib/icons";

function getIcon(name: string) {
  return resolveIcon(name, Icons.Sun);
}

/**
 * 天气组件（展示 + 城市修正）
 * 数据与定位都在 @/hooks/useWeather；这里只负责展示、手动指定城市与重新定位
 */
export default function WeatherWidget() {
  const { t, locale } = useI18n();
  const { data, status, reload, setCity, relocate } = useWeather();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitCity(e: FormEvent) {
    e.preventDefault();
    const name = draft.trim();
    if (!name || submitting) return;
    setSubmitting(true);
    const ok = await setCity(name);
    setSubmitting(false);
    if (ok) {
      setEditing(false);
      setDraft("");
    }
  }

  const cityEditor = editing ? (
    <form onSubmit={submitCity} className="mt-2 flex items-center gap-1.5">
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={t.weather.cityPlaceholder}
        className="min-w-0 flex-1 rounded-lg border border-stroke bg-transparent px-2.5 py-1.5 text-[11px] text-ink outline-none placeholder:text-ink-subtle focus:border-brand"
      />
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg border border-stroke px-2.5 py-1.5 text-[11px] text-ink transition-colors hover:bg-white/5 disabled:opacity-50"
      >
        {t.weather.setCity}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-white/5"
        title={t.cancel}
      >
        <Icons.X size={12} />
      </button>
    </form>
  ) : null;

  if (!data) {
    if (status === "error") {
      return (
        <div className="rounded-2xl border border-stroke bg-bg-elevate/50 p-4 backdrop-blur-sm shadow-glow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icons.CloudSun size={16} className="text-amber-400" />
              <span className="text-[13px] font-semibold text-ink/80">{t.weather.title}</span>
            </div>
            <button
              onClick={() => relocate()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
              title={t.weather.useGps}
            >
              <Icons.RefreshCw size={14} />
            </button>
          </div>
          <div className="mt-3 flex flex-col items-center justify-center gap-2 py-4 text-center">
            <Icons.MapPin size={24} className="text-ink-subtle opacity-60" />
            <p className="text-[11px] text-ink-muted">{t.weather.locateFailed}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => relocate()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stroke px-3 py-1.5 text-xs text-ink transition-colors hover:bg-white/5"
              >
                <Icons.MapPin size={12} /> {t.weather.useGps}
              </button>
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stroke px-3 py-1.5 text-xs text-ink transition-colors hover:bg-white/5"
              >
                {t.weather.setCity}
              </button>
            </div>
            {cityEditor}
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-stroke bg-bg-elevate/50 p-4 backdrop-blur-sm shadow-glow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.CloudSun size={16} className="text-amber-400 animate-pulse" />
            <span className="text-[13px] font-semibold text-ink/80">{t.weather.title}</span>
          </div>
          <Icons.Loader2 size={14} className="animate-spin text-ink-muted" />
        </div>
        <div className="mt-3 flex flex-col items-center justify-center gap-2 py-6 text-center text-[11px] text-ink-muted">
          <Icons.MapPin size={22} className="animate-pulse text-ink-subtle" />
          {t.weather.locating}
        </div>
      </div>
    );
  }

  const MainIcon = getIcon(data.icon || "Sun");
  const tag = data.src === "manual" ? t.weather.manualTag : data.src === "ip" ? t.weather.ipTag : "";
  return (
    <div className="rounded-2xl border border-stroke bg-bg-elevate/50 p-4 backdrop-blur-sm shadow-glow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icons.CloudSun size={16} className="text-amber-400" />
          <span className="text-[13px] font-semibold text-ink/80">{t.weather.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => relocate()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
            title={t.weather.useGps}
          >
            <Icons.MapPin size={14} />
          </button>
          <button
            onClick={() => reload()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
            title={t.common.refresh}
          >
            <Icons.RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="mt-2">
        <button
          onClick={() => setEditing((v) => !v)}
          className="inline-flex max-w-full items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-ink-muted transition-colors hover:bg-white/10 hover:text-ink"
          title={t.weather.setCity}
        >
          <Icons.MapPin size={9} className="shrink-0" />
          <span className="truncate">
            {data.city}
            {tag ? " · " + tag : ""}
          </span>
          <span className="shrink-0 opacity-90">
            · {locale === "en" ? "Updated" : "更新"} {data.updatedAt}
          </span>
        </button>
      </div>
      {cityEditor}

      <div className="mt-3 flex items-start gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/5">
          <MainIcon size={34} className={data.isDay ? "text-amber-400" : "text-indigo-300"} />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-ink">{data.temp}</span>
            <span className="text-sm text-ink-muted">°C</span>
          </div>
          <p className="text-[13px] text-ink/80">{locale === "en" ? data.conditionEn : data.condition}</p>
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
              <span className="text-[10px] text-ink-muted">{locale === "en" ? d.dayEn : d.day}</span>
              <I size={16} className="text-amber-400" />
              <span className="text-[11px] font-semibold text-ink">{d.max}° / {d.min}°</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}