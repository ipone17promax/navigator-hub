import { useCallback, useEffect, useState } from "react";
import { safeJson, fetchWithTimeout } from "@/lib/api";
import { logger } from "@/lib/logger";

export interface Forecast {
  day: string;
  dayEn: string;
  max: number;
  min: number;
  icon: string;
}

export interface WeatherData {
  temp: number;
  condition: string;
  conditionEn: string;
  icon: string;
  city: string;
  humidity: number;
  windSpeed: number;
  isDay: boolean;
  updatedAt: string;
  forecast: Forecast[];
}

export type WeatherStatus = "loading" | "ok" | "error";

const POS_KEY = "nh.weather.pos.v1";
const DATA_KEY = "nh.weather.data.v1";
const POS_TTL = 12 * 60 * 60 * 1000;
const DATA_TTL = 30 * 60 * 1000;
const DEFAULT_POS = { lat: 39.9075, lon: 116.3972 };

interface Pos {
  lat: number;
  lon: number;
  at?: number;
}

interface CachedData {
  at: number;
  data: WeatherData;
}

let memoryData: WeatherData | null = null;
let inflight: Promise<WeatherData | null> | null = null;

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 隐私模式/配额满时忽略 */
  }
}

function wmoToText(code: number, isDay: boolean): { c: string; en: string; icon: string } {
  const sun = isDay ? "Sun" : "Moon";
  const cloudSun = isDay ? "CloudSun" : "CloudMoon";
  const map: Record<number, { c: string; en: string; icon: string }> = {
    0: { c: "晴", en: "Clear", icon: sun },
    1: { c: "晴间多云", en: "Mostly clear", icon: cloudSun }, 2: { c: "多云", en: "Partly cloudy", icon: cloudSun },
    3: { c: "阴", en: "Overcast", icon: "Cloud" },
    45: { c: "雾", en: "Fog", icon: "CloudFog" }, 48: { c: "雾凇", en: "Rime fog", icon: "CloudFog" },
    51: { c: "小毛毛雨", en: "Light drizzle", icon: "CloudDrizzle" }, 53: { c: "毛毛雨", en: "Drizzle", icon: "CloudDrizzle" },
    55: { c: "大毛毛雨", en: "Heavy drizzle", icon: "CloudDrizzle" }, 56: { c: "冻毛毛雨", en: "Freezing drizzle", icon: "CloudHail" },
    57: { c: "冻毛毛雨", en: "Freezing drizzle", icon: "CloudHail" },
    61: { c: "小雨", en: "Light rain", icon: "CloudRain" }, 63: { c: "中雨", en: "Rain", icon: "CloudRain" },
    65: { c: "大雨", en: "Heavy rain", icon: "CloudRain" }, 66: { c: "冻雨", en: "Freezing rain", icon: "CloudHail" },
    67: { c: "冻雨", en: "Freezing rain", icon: "CloudHail" },
    71: { c: "小雪", en: "Light snow", icon: "CloudSnow" }, 73: { c: "中雪", en: "Snow", icon: "CloudSnow" },
    75: { c: "大雪", en: "Heavy snow", icon: "CloudSnow" }, 77: { c: "米雪", en: "Snow grains", icon: "CloudSnow" },
    80: { c: "小阵雨", en: "Light showers", icon: "CloudRain" }, 81: { c: "阵雨", en: "Showers", icon: "CloudRain" },
    82: { c: "强阵雨", en: "Heavy showers", icon: "CloudRain" }, 85: { c: "小阵雪", en: "Light snow showers", icon: "CloudSnow" },
    86: { c: "大阵雪", en: "Heavy snow showers", icon: "CloudSnow" },
    95: { c: "雷暴", en: "Thunderstorm", icon: "CloudLightning" }, 96: { c: "雷暴伴小冰雹", en: "Thunderstorm with hail", icon: "CloudLightning" },
    99: { c: "雷暴伴大冰雹", en: "Thunderstorm with heavy hail", icon: "CloudLightning" },
  };
  const hit = map[code];
  return hit ? hit : { c: "未知", en: "Unknown", icon: "Cloud" };
}

function getPos(): Promise<Pos> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("no geolocation"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      (e) => reject(e),
      { timeout: 4000, maximumAge: 1800000, enableHighAccuracy: false },
    );
  });
}

function inChina(lat: number, lon: number): boolean {
  return lat >= 18 && lat <= 54 && lon >= 73 && lon <= 135;
}

async function fromIpwho(): Promise<Pos> {
  const j = await safeJson<{ success: boolean; latitude?: number; longitude?: number }>(
    "https://ipwho.is/?lang=zh",
    { timeoutMs: 3500 },
  );
  if (j && j.success && typeof j.latitude === "number" && typeof j.longitude === "number") {
    const pos = { lat: j.latitude, lon: j.longitude };
    if (inChina(pos.lat, pos.lon)) return pos;
  }
  throw new Error("ipwho failed");
}

async function fromIpapi(): Promise<Pos> {
  const j = await safeJson<{ latitude?: number; longitude?: number }>(
    "https://ipapi.co/json/",
    { timeoutMs: 3500 },
  );
  if (j && typeof j.latitude === "number" && typeof j.longitude === "number") {
    const pos = { lat: j.latitude, lon: j.longitude };
    if (inChina(pos.lat, pos.lon)) return pos;
  }
  throw new Error("ipapi failed");
}

async function fromIpinfo(): Promise<Pos> {
  const j = await safeJson<{ loc?: string }>("https://ipinfo.io/json", { timeoutMs: 3500 });
  if (j?.loc) {
    const [lat, lon] = j.loc.split(",").map(Number);
    if (Number.isFinite(lat) && Number.isFinite(lon) && inChina(lat, lon)) return { lat, lon };
  }
  throw new Error("ipinfo failed");
}

async function fromIpapiIs(): Promise<Pos> {
  const j = await safeJson<{ lat?: number; lon?: number }>("https://api.ipapi.is/", { timeoutMs: 3500 });
  if (typeof j?.lat === "number" && typeof j?.lon === "number" && inChina(j.lat, j.lon)) {
    return { lat: j.lat, lon: j.lon };
  }
  throw new Error("ipapi.is failed");
}

function firstSuccess<T>(tasks: Promise<T>[]): Promise<T | null> {
  return new Promise((resolve) => {
    let done = false;
    let remaining = tasks.length;
    for (const task of tasks) {
      task
        .then((v) => {
          if (!done) {
            done = true;
            resolve(v);
          }
        })
        .catch(() => {
          remaining -= 1;
          if (remaining === 0 && !done) resolve(null);
        });
    }
  });
}

/**
 * 定位：缓存坐标 → 浏览器定位与 IP 定位并行，最多等 4.2 秒
 *   - 不再串行等待多个失败接口，避免天气卡长时间空白
 *   - 全部失败时直接使用北京，保证天气能显示
 */
async function locate(): Promise<Pos> {
  const cached = readJson<Pos>(POS_KEY);
  if (cached && cached.at && Date.now() - cached.at < POS_TTL) return cached;

  const timeout = () => new Promise<null>((r) => setTimeout(() => r(null), 4200));
  const geo = getPos()
    .then((p) => (inChina(p.lat, p.lon) ? p : null))
    .catch(() => null);
  const ip = firstSuccess([fromIpwho(), fromIpapi(), fromIpinfo(), fromIpapiIs()]);

  const [g, i] = await Promise.all([Promise.race([geo, timeout()]), Promise.race([ip, timeout()])]);
  const pos = g || i || DEFAULT_POS;
  writeJson(POS_KEY, { ...pos, at: Date.now() });
  return pos;
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  // bigdatacloud 基于坐标反查（支持 CORS，中文地名）
  try {
    const r = await fetchWithTimeout(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`,
      { timeoutMs: 5000 },
    );
    if (r.ok) {
      const j: any = await r.json();
      const name = j.city || j.locality || j.principalSubdivision || j.countryName;
      if (name) return name;
    }
  } catch { /* ignore */ }

  // 备选：nominatim（OpenStreetMap，中文地名）
  try {
    const r = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=zh`,
      { timeoutMs: 5000 },
    );
    if (r.ok) {
      const j: any = await r.json();
      const addr = j.address || {};
      const name = addr.city || addr.town || addr.county || addr.state || addr.country;
      if (name) return name;
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
  const weekdaysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const forecast: Forecast[] = day.time.map((t: string, i: number) => {
    const d = new Date(t);
    const label = i === 0 ? "今天" : "周" + weekdays[d.getDay()];
    const labelEn = i === 0 ? "Today" : weekdaysEn[d.getDay()];
    const f = wmoToText(day.weather_code[i], true);
    return {
      day: label,
      dayEn: labelEn,
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
    conditionEn: curText.en,
    icon: curText.icon,
    humidity: cur.relative_humidity_2m,
    windSpeed: Math.round(cur.wind_speed_10m),
    isDay,
    updatedAt,
    forecast,
  };
}

/** 同一时刻只发一轮请求，天气卡与顶部迷你天气共用结果 */
function loadShared(): Promise<WeatherData | null> {
  if (!inflight) {
    inflight = (async () => {
      try {
        const { lat, lon } = await locate();
        const [city, w] = await Promise.all([reverseGeocode(lat, lon), fetchWeather(lat, lon)]);
        const data: WeatherData = { ...w, city };
        memoryData = data;
        writeJson(DATA_KEY, { at: Date.now(), data } satisfies CachedData);
        logger.info("useWeather", "天气获取成功", { city, temp: w.temp });
        return data;
      } catch (e) {
        logger.error("useWeather", "天气获取失败", { error: (e as Error)?.message });
        return null;
      }
    })().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

export function useWeather() {
  const [data, setData] = useState<WeatherData | null>(
    () => memoryData ?? readJson<CachedData>(DATA_KEY)?.data ?? null,
  );
  const [status, setStatus] = useState<WeatherStatus>(() => (data ? "ok" : "loading"));

  const load = useCallback(async (force = false) => {
    const stored = readJson<CachedData>(DATA_KEY);
    const cached = memoryData ? { at: stored?.at ?? 0, data: memoryData } : stored;
    if (cached) {
      setData(cached.data);
      setStatus("ok");
      if (!force && Date.now() - cached.at < DATA_TTL) return;
    } else {
      setStatus("loading");
    }

    const fresh = await loadShared();
    if (fresh) {
      setData(fresh);
      setStatus("ok");
    } else if (!cached) {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, status, reload: () => load(true) };
}
