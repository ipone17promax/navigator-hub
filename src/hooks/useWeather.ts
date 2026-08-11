import { useCallback, useEffect, useState } from "react";
import { safeJson, fetchWithTimeout } from "@/lib/api";
import { logger } from "@/lib/logger";

export interface Forecast {
  day: string;
  max: number;
  min: number;
  icon: string;
}

export interface WeatherData {
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

export type WeatherStatus = "loading" | "ok" | "error";

function wmoToText(code: number, isDay: boolean): { c: string; icon: string } {
  const sun = isDay ? "Sun" : "Moon";
  const cloudSun = isDay ? "CloudSun" : "CloudMoon";
  const map: Record<number, { c: string; icon: string }> = {
    0: { c: "晴", icon: sun },
    1: { c: "晴间多云", icon: cloudSun }, 2: { c: "多云", icon: cloudSun },
    3: { c: "阴", icon: "Cloud" },
    45: { c: "雾", icon: "CloudFog" }, 48: { c: "雾凇", icon: "CloudFog" },
    51: { c: "毛毛雨", icon: "CloudDrizzle" }, 53: { c: "毛毛雨", icon: "CloudDrizzle" },
    55: { c: "毛毛雨", icon: "CloudDrizzle" }, 56: { c: "冻毛毛雨", icon: "CloudHail" },
    57: { c: "冻毛毛雨", icon: "CloudHail" },
    61: { c: "小雨", icon: "CloudRain" }, 63: { c: "中雨", icon: "CloudRain" },
    65: { c: "大雨", icon: "CloudRain" }, 66: { c: "冻雨", icon: "CloudHail" },
    67: { c: "冻雨", icon: "CloudHail" },
    71: { c: "小雪", icon: "CloudSnow" }, 73: { c: "中雪", icon: "CloudSnow" },
    75: { c: "大雪", icon: "CloudSnow" }, 77: { c: "米雪", icon: "CloudSnow" },
    80: { c: "阵雨", icon: "CloudRain" }, 81: { c: "阵雨", icon: "CloudRain" },
    82: { c: "暴雨", icon: "CloudRain" }, 85: { c: "阵雪", icon: "CloudSnow" },
    86: { c: "阵雪", icon: "CloudSnow" },
    95: { c: "雷暴", icon: "CloudLightning" }, 96: { c: "雷暴伴冰雹", icon: "CloudLightning" },
    99: { c: "雷暴伴冰雹", icon: "CloudLightning" },
  };
  const hit = map[code];
  return hit ? hit : { c: "未知", icon: "Cloud" };
}

function getPos(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("no geolocation"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      (e) => reject(e),
      { timeout: 8000, maximumAge: 600000, enableHighAccuracy: false },
    );
  });
}

async function locate(): Promise<{ lat: number; lon: number }> {
  try {
    return await getPos();
  } catch {
    try {
      const j = await safeJson<{ success: boolean; latitude?: number; longitude?: number }>("https://ipwho.is/");
      if (j && j.success && typeof j.latitude === "number" && typeof j.longitude === "number") {
        return { lat: j.latitude, lon: j.longitude };
      }
    } catch { /* 继续兜底 */ }
    return { lat: 39.9075, lon: 116.3972 };
  }
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const r = await fetchWithTimeout(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`,
      { timeoutMs: 5000 },
    );
    if (r.ok) {
      const j: any = await r.json();
      return j.city || j.locality || j.principalSubdivision || "本地";
    }
  } catch { /* ignore */ }
  return "本地";
}

async function fetchWeather(lat: number, lon: number): Promise<Omit<WeatherData, "city">> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4`;
  const r = await fetchWithTimeout(url, { timeoutMs: 10000 });
  if (!r.ok) {
    logger.error("useWeather", "Open-Meteo 接口异常", { status: r.status, url });
    throw new Error("weather api failed");
  }
  const j: any = await r.json();
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

export function useWeather() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [status, setStatus] = useState<WeatherStatus>("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    logger.info("useWeather", "开始加载天气");
    try {
      const { lat, lon } = await locate();
      const [city, w] = await Promise.all([reverseGeocode(lat, lon), fetchWeather(lat, lon)]);
      setData({ ...w, city });
      setStatus("ok");
      logger.info("useWeather", "天气获取成功", { city, temp: w.temp });
    } catch (e) {
      setStatus("error");
      logger.error("useWeather", "天气获取失败", { error: (e as Error)?.message });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, status, reload: load };
}
