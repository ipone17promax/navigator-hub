import { useCallback, useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { logger } from "@/lib/logger";

interface Forecast {
  day: string;
  max: number;
  min: number;
  icon: string;
}

interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  city: string;
  humidity: number;
  windSpeed: number;
  isDay: boolean;
  updatedAt: string;
  forecast: Forecast[];
}

type Status = "loading" | "ok" | "error";

/** WMO weather_code → 中文描述 + lucide 图标名（按白天/夜间切换） */
function wmoToText(code: number, isDay: boolean): { c: string; icon: string } {
  const sun = isDay ? "Sun" : "Moon";
  const cloudSun = isDay ? "CloudSun" : "CloudMoon";
  const map: Record<number, { c: string; icon: string }> = {
    0: { c: "晴", icon: sun },
    1: { c: "晴间多云", icon: cloudSun },
    2: { c: "多云", icon: cloudSun },
    3: { c: "阴", icon: "Cloud" },
    45: { c: "雾", icon: "CloudFog" },
    48: { c: "雾凇", icon: "CloudFog" },
    51: { c: "毛毛雨", icon: "CloudDrizzle" },
    53: { c: "毛毛雨", icon: "CloudDrizzle" },
    55: { c: "毛毛雨", icon: "CloudDrizzle" },
    56: { c: "冻毛毛雨", icon: "CloudHail" },
    57: { c: "冻毛毛雨", icon: "CloudHail" },
    61: { c: "小雨", icon: "CloudRain" },
    63: { c: "中雨", icon: "CloudRain" },
    65: { c: "大雨", icon: "CloudRain" },
    66: { c: "冻雨", icon: "CloudHail" },
    67: { c: "冻雨", icon: "CloudHail" },
    71: { c: "小雪", icon: "CloudSnow" },
    73: { c: "中雪", icon: "CloudSnow" },
    75: { c: "大雪", icon: "CloudSnow" },
    77: { c: "米雪", icon: "CloudSnow" },
    80: { c: "阵雨", icon: "CloudRain" },
    81: { c: "阵雨", icon: "CloudRain" },
    82: { c: "暴雨", icon: "CloudRain" },
    85: { c: "阵雪", icon: "CloudSnow" },
    86: { c: "阵雪", icon: "CloudSnow" },
    95: { c: "雷暴", icon: "CloudLightning" },
    96: { c: "雷暴伴冰雹", icon: "CloudLightning" },
    99: { c: "雷暴伴冰雹", icon: "CloudLightning" },
  };
  return map[code] ?? { c: "未知", icon: "Cloud" };
}

/** 浏览器精确定位（会弹授权框） */
function getPos(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("no geolocation"));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 8000, maximumAge: 600000, enableHighAccuracy: false },
    );
  });
}

/** 三级降级定位：浏览器定位 → IP 定位 → 北京兜底 */
async function locate(): Promise<{ lat: number; lon: number }> {
  try {
    return await getPos();
  } catch {
    // IP 定位兜底（无需授权）
    try {
      const r = await fetch("https://ipwho.is/");
      if (r.ok) {
        const j = await r.json();
        if (j && j.success && typeof j.latitude === "number" && typeof j.longitude === "number") {
          return { lat: j.latitude, lon: j.longitude };
        }
      }
    } catch {
      /* 继续 fallback */
    }
    return { lat: 39.9075, lon: 116.3972 }; // 北京
  }
}

/** 反向地理编码：经纬度 → 中文城市名 */
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const r = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`,
    );
    if (r.ok) {
      const j = await r.json();
      return j.city || j.locality || j.principalSubdivision || "本地";
    }
  } catch {
    /* ignore */
  }
  return "本地";
}

/** 调 Open-Meteo 拉实时天气 + 4 天预报 */
async function fetchWeather(lat: number, lon: number): Promise<Omit<WeatherData, "city">> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4`;
  const r = await fetch(url);
  if (!r.ok) {
    logger.error("WeatherWidget", "Open-Meteo 接口异常", { status: r.status, url });
    throw new Error("weather api failed");
  }
  const j = await r.json();
  const cur = j.current;
  const day = j.daily;
  const isDay = cur.is_day === 1;
  const curText = wmoToText(cur.weather_code, isDay);

  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  const forecast: Forecast[] = day.time.map((t: string, i: number) => {
    const d = new Date(t);
    const label = i === 0 ? "今天" : "周" + weekdays[d.getDay()];
    const f = wmoToText(day.weather_code[i], true);
    return {
      day: label,
      max: Math.round(day.temperature_2m_max[i]),
      min: Math.round(day.temperature_2m_min[i]),
      icon: f.icon,
    };
  });

  const now = new Date();
  const updatedAt = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return {
    temp: Math.round(cur.temperature_2m),
    condition: curText.c,
    icon: curText.icon,
    humidity: cur.relative_humidity_2m,
    windSpeed: Math.round(cur.wind_speed_10m),
    isDay,
    updatedAt,
    forecast,
  };
}

function getIcon(name: string): Icons.LucideIcon {
  return (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Sun;
}

export default function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    logger.info("WeatherWidget", "开始加载天气");
    try {
      const { lat, lon } = await locate();
      const [city, w] = await Promise.all([reverseGeocode(lat, lon), fetchWeather(lat, lon)]);
      setData({ ...w, city });
      setStatus("ok");
      logger.info("WeatherWidget", "天气获取成功", { city, temp: w.temp });
    } catch (e) {
      setStatus("error");
      logger.error("WeatherWidget", "天气获取失败（可能 CORS 或网络）", {
        error: (e as Error)?.message,
      });
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 600000); // 10 分钟刷新一次
    return () => clearInterval(timer);
  }, [load]);

  // 加载中
  if (status === "loading" && !data) {
    return (
      <div className="rounded-2xl border border-stroke bg-bg-elevate/60 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Icons.Loader2 size={26} className="animate-spin text-amber-400" />
          <div>
            <div className="text-sm font-medium text-ink-muted">正在定位并获取天气…</div>
            <div className="text-xs text-ink-subtle">首次加载需要授权位置权限</div>
          </div>
        </div>
      </div>
    );
  }

  // 加载失败
  if (status === "error") {
    return (
      <div className="rounded-2xl border border-stroke bg-bg-elevate/60 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icons.AlertTriangle size={22} className="text-amber-400" />
            <div>
              <div className="text-sm font-medium text-ink-muted">天气获取失败</div>
              <div className="text-xs text-ink-subtle">网络或定位异常</div>
            </div>
          </div>
          <button
            onClick={load}
            className="rounded-lg border border-stroke px-2 py-1 text-xs text-ink-muted transition-colors hover:border-stroke-hover hover:text-ink"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const MainIcon = getIcon(data.icon);

  return (
    <div className="rounded-2xl border border-stroke bg-bg-elevate/60 p-4 backdrop-blur-xl transition-all duration-300 hover:border-stroke-hover">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient/20">
            <MainIcon size={26} className="text-amber-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-ink">{data.temp}°</span>
              <span className="text-sm text-ink-muted">{data.condition}</span>
            </div>
            <div className="text-xs text-ink-subtle">{data.city} · 实时天气</div>
          </div>
        </div>
        <Icons.RefreshCw
          size={14}
          className={`cursor-pointer text-ink-subtle transition-colors hover:text-ink ${status === "loading" ? "animate-spin" : ""}`}
          onClick={load}
        />
      </div>

      {/* 实时指标 */}
      <div className="mt-2 flex items-center gap-3 text-[11px] text-ink-subtle">
        <span className="flex items-center gap-1">
          <Icons.Droplets size={12} /> 湿度 {data.humidity}%
        </span>
        <span className="flex items-center gap-1">
          <Icons.Wind size={12} /> {data.windSpeed} km/h
        </span>
        <span className="ml-auto">更新于 {data.updatedAt}</span>
      </div>

      {/* 4 天预报 */}
      <div className="mt-3 flex justify-between border-t border-stroke/50 pt-3">
        {data.forecast.map((f) => {
          const FIcon = getIcon(f.icon);
          return (
            <div key={f.day} className="flex flex-col items-center gap-1">
              <span className="text-[11px] text-ink-subtle">{f.day}</span>
              <FIcon size={16} className="text-cyan-400" />
              <span className="text-xs font-medium text-ink-muted">{f.max}°</span>
              <span className="text-[10px] text-ink-subtle">{f.min}°</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
