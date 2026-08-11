import * as Icons from "lucide-react";
import { useWeather } from "@/hooks/useWeather";
import { resolveIcon } from "@/lib/icons";

/**
 * 360 风格顶部迷你天气：只显示 图标+温度+城市，点击无操作
 * 完整天气在下方 InfoStrip 的 WeatherWidget 里
 * 加载/失败时显示占位，不报错
 */
export default function WeatherMini() {
  const { data, status } = useWeather();
  if (status === "loading" || !data) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-xl border border-stroke bg-bg-elevate/60 px-2.5 py-2 text-ink-muted backdrop-blur">
        <Icons.CloudSun size={14} className="animate-pulse text-amber-400" />
        <span className="text-[12px]">--°</span>
      </div>
    );
  }
  const I = resolveIcon(data.icon, Icons.Sun);
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-xl border border-stroke bg-bg-elevate/60 px-2.5 py-2 text-ink-muted backdrop-blur transition-colors hover:border-stroke-hover hover:text-ink"
      title={`${data.city} · ${data.condition} · ${data.temp}°C · 湿度${data.humidity}%`}
    >
      <I size={14} className={data.isDay ? "text-amber-400" : "text-indigo-300"} />
      <span className="text-[12px] font-semibold text-ink/80">{data.temp}°</span>
      <span className="hidden text-[10px] sm:inline">{data.city}</span>
    </div>
  );
}
