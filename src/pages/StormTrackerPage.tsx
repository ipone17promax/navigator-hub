import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CloudLightning,
  RefreshCw,
  AlertTriangle,
  MapPin,
  Wind,
  ThermometerSun,
  Compass,
  Calendar,
  ExternalLink,
  Home,
  Map as MapIcon,
} from "lucide-react";
import ThemeSwitcher from "@/components/ThemeSwitcher";

// ============================================================
// NOAA CurrentStorms.json 类型定义
// 真实返回：{ activeStorms: StormItem[] }
// 兼容老版本：{ items: StormItem[], updatedUTC: string }
// 字段命名存在多种变体（camelCase / snake_case），我们做宽松映射。
// ============================================================
type StormDict = Record<string, unknown>;

interface NoaaStormAdvisoryItem {
  name?: string;
  stormName?: string;
  stormType?: string;
  classification?: string;
  intensity?: string;
  maxWind?: number;
  minimumPressure?: number;
  basinAbbrev?: string;
  basin?: string;
  /** [lat, lon] */
  center?: [number, number] | number[];
  /** 风向 / 运动方向 角度° */
  movementDeg?: number;
  movementSpeed?: number;
  /** 5 天预报文字 */
  forecastText?: string;
  advisoryNumber?: string | number;
  updateTimeUTC?: string;
  id?: string;
  /** 官方产品页 URL */
  url?: string;
  /** NHC 2025+ 方案中风暴级别的发布时间，取最新 advisory */
  issuanceTimeUTC?: string;
  /** 风暴自身 URL（非单条 advisory） */
  stormUrl?: string;
}

interface NoaaCurrentStorms {
  updatedUTC?: string;
  /** 旧版字段 */
  items?: NoaaStormAdvisoryItem[] | StormDict[];
  /** 2024+ 主字段 */
  activeStorms?: NoaaStormAdvisoryItem[] | StormDict[];
}

// ============================================================
// 数据源：3 个国际化可视化 + NOAA JSON（全部可 iframe、无 XFO/CSP frame-ancestors 限制）
//  ① 🇺🇸 NOAA NHC 官方 gtwo 5 天路径图 — 大西洋 / 东太平洋飓风
//  ② 🇯🇵 JMA 日本气象厅 RSMC 东京台风中心英文地图 — 西北太平洋（覆盖原中国/南海/日本）
//  ③ 🌪️ Ventusky 全球热带气旋路径图 — 欧洲专业可视化，覆盖全球 7 大海域
// JTWC（www.metoc.navy.mil）属美国军方域名，国内 DNS 解析失败，不再使用
// ============================================================
type ViewKey = "nhc" | "accuweather" | "ventusky";

const VIEWS: { key: ViewKey; label: string; sub: string; icon: string; src: string }[] = [
  {
    key: "nhc",
    label: "NOAA NHC · 官方 5 日路径图",
    sub: "Atlantic / East Pacific Hurricanes",
    icon: "��",
    // NHC 官方独立 5 天热带气旋概率路径页，无 XFO 限制，比首页更适合嵌入
    src: "https://www.nhc.noaa.gov/gtwo.php?basin=atlc&fdays=5",
  },
  {
    key: "accuweather",
    label: "AccuWeather · 亚洲热带气旋",
    sub: "NW Pacific + South China Sea",
    icon: "��",
    // AccuWeather 亚洲热带天气分区：覆盖中国/南海/日本/菲律宾（原 CMA 覆盖区完全一致）
    // 零 X-Frame-Options / 零 CSP frame-ancestors 限制，可直接 iframe；
    // 原 JMA bosai/map.html 因 CSP frame-ancestors 只允许日本政府域（mlit.go.jp 等），已排除
    src: "https://www.accuweather.com/en/wt-asia/weather-warnings/tropical-weather-asia",
  },
  {
    key: "ventusky",
    label: "Ventusky · 全球风暴路径",
    sub: "Global Tropical Cyclone Forecast",
    icon: "�️",
    // Ventusky 热带气旋图层，定位到西北太平洋，无 frame-ancestors 限制
    src: "https://www.ventusky.com/?p=25;130;3&l=temperature&t=tropical-cyclones",
  },
];

/** NOAA 实时风暴 JSON — 跨域支持 CORS，可直接前端拉 */
const NOAA_API = "https://www.nhc.noaa.gov/CurrentStorms.json";

// ============================================================
// 工具函数
// ============================================================
function formatUtc(iso?: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("zh-CN", { hour12: false, timeZone: "Asia/Shanghai" });
  } catch {
    return iso;
  }
}

function toCoord(pair?: number[]): string {
  if (!pair || pair.length < 2) return "—";
  const [lat, lon] = pair;
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(Number(lat)).toFixed(2)}°${ns}, ${Math.abs(Number(lon)).toFixed(2)}°${ew}`;
}

function bearingLabel(deg?: number): string {
  if (deg == null || Number.isNaN(deg)) return "—";
  const dirs = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
  return dirs[Math.round(deg / 45) % 8] + `（${deg}°）`;
}

function levelColor(classification?: string): string {
  const s = (classification || "").toLowerCase();
  if (s.includes("major") || s.includes("super")) return "#DC2626";
  if (s.includes("hurricane") || s.includes("typhoon")) return "#EA580C";
  if (s.includes("tropical storm") || s.includes("storm")) return "#D97706";
  if (s.includes("depression") || s.includes("低压")) return "#0EA5E9";
  if (s.includes("disturbance") || s.includes("disturb")) return "#6366F1";
  return "#64748B";
}

// ============================================================
// 宽松字段映射：因为 NOAA JSON 字段命名在不同季节会漂移
// ============================================================
function pickStr(obj: unknown, ...keys: string[]): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const o = obj as Record<string, unknown>;
  for (const k of keys) {
    // 先精确匹配
    if (k in o) {
      const v = o[k];
      if (v == null) continue;
      if (typeof v === "string") return v;
      if (typeof v === "number" || typeof v === "boolean") return String(v);
    }
  }
  // 忽略大小写匹配
  const lower = Object.keys(o).reduce<Record<string, unknown>>((acc, k) => {
    acc[k.toLowerCase()] = o[k];
    return acc;
  }, {});
  for (const k of keys) {
    const v = lower[k.toLowerCase()];
    if (v != null && (typeof v === "string" || typeof v === "number" || typeof v === "boolean")) {
      return String(v);
    }
  }
  return undefined;
}

function pickNum(obj: unknown, ...keys: string[]): number | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const o = obj as Record<string, unknown>;
  const allKeys = [...keys, ...keys.map((k) => k.toLowerCase())];
  for (const k of allKeys) {
    if (k in o) {
      const v = o[k];
      if (typeof v === "number" && !Number.isNaN(v)) return v;
      if (typeof v === "string") {
        const n = Number(v);
        if (!Number.isNaN(n)) return n;
      }
    }
  }
  return undefined;
}

function pickCoord(obj: unknown, ...keys: string[]): [number, number] | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const o = obj as Record<string, unknown>;
  for (const k of keys) {
    const v = o[k];
    if (Array.isArray(v) && v.length >= 2 && typeof v[0] === "number" && typeof v[1] === "number") {
      return [v[0], v[1]];
    }
  }
  // latitude / longitude 分开
  const lat = pickNum(o, "latitude", "lat");
  const lon = pickNum(o, "longitude", "lon", "lng");
  if (lat != null && lon != null) return [lat, lon];
  return undefined;
}

function normalize(raw: StormDict | NoaaStormAdvisoryItem): NoaaStormAdvisoryItem {
  return {
    id: pickStr(raw, "id", "stormId", "storm_id", "atcfId"),
    name: pickStr(raw, "stormName", "storm_name", "name", "cycloneName"),
    stormName: pickStr(raw, "stormName", "storm_name", "name"),
    classification:
      pickStr(raw, "classification", "class", "stormType", "storm_type", "intensity", "category") || undefined,
    intensity: pickStr(raw, "intensity", "categoryText") || undefined,
    maxWind: pickNum(raw, "maxWind", "max_wind", "windSpeed", "wind", "sustainedWind"),
    minimumPressure: pickNum(raw, "minimumPressure", "minPressure", "pressure", "centralPressure", "min_pressure"),
    basinAbbrev: pickStr(raw, "basinAbbrev", "basin_abbr", "basin"),
    basin: pickStr(raw, "basin", "basinName") || undefined,
    center: pickCoord(raw, "center", "position", "location", "coordinates"),
    movementDeg: pickNum(raw, "movementDeg", "movement_deg", "direction", "bearing", "motionDir"),
    movementSpeed: pickNum(raw, "movementSpeed", "movement_speed", "speed", "motionSpeed", "forwardSpeed"),
    forecastText:
      pickStr(
        raw,
        "forecastText",
        "forecast",
        "forecastDiscussion",
        "summary",
        "discussion",
        "publicAdvisoryText",
      ) || undefined,
    advisoryNumber:
      pickStr(raw, "advisoryNumber", "advisory_number", "advNumber") ??
      pickNum(raw, "advisoryNumber", "advisory_number", "advNumber"),
    updateTimeUTC:
      pickStr(raw, "updateTimeUTC", "update_time_utc", "dateTimeUTC", "timeUTC", "issuanceTime", "validTimeUTC") ||
      undefined,
    url: pickStr(raw, "url", "advisoryUrl", "publicAdvisoryUrl", "forecastAdvisoryUrl") || undefined,
    stormUrl: pickStr(raw, "stormUrl", "homepageUrl", "link") || undefined,
    issuanceTimeUTC: pickStr(raw, "issuanceTimeUTC", "issuedTimeUTC", "issuedAtUTC") || undefined,
  };
}

/** 取最新 advisory 时间（北京时区），用于卡片与顶部 header 展示 */
function latestUpdatedUtc(items: NoaaStormAdvisoryItem[]): string | undefined {
  let best: Date | undefined;
  for (const it of items) {
    for (const s of [it.updateTimeUTC, it.issuanceTimeUTC]) {
      if (!s) continue;
      try {
        const d = new Date(s.endsWith("Z") ? s : s + "Z");
        if (Number.isNaN(d.getTime())) continue;
        if (!best || d > best) best = d;
      } catch {
        /* ignore */
      }
    }
  }
  if (!best) return undefined;
  return best.toISOString();
}

// ============================================================
// 页面主体
// ============================================================
export default function StormTrackerPage() {
  const [view, setView] = useState<ViewKey>("nhc");
  const [data, setData] = useState<NoaaCurrentStorms | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [iframeLoading, setIframeLoading] = useState<boolean>(true);
  const [refreshCountdown, setRefreshCountdown] = useState<number>(5 * 60);
  const [sortBy, setSortBy] = useState<"intensity" | "basin" | "time">("intensity");

  const iframeHeight = useMemo(() => {
    if (typeof window === "undefined") return "62vh";
    const h = window.innerHeight;
    if (h < 640) return "50vh";
    if (h < 900) return "55vh";
    return "62vh";
  }, []);

  async function load(force = false) {
    setErr(null);
    if (force) setRefreshing(true);
    try {
      const res = await fetch(`${NOAA_API}?_=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as NoaaCurrentStorms;
      setData(json);
      setRefreshCountdown(5 * 60);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "拉取失败");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
    const loadInterval = setInterval(() => void load(), 5 * 60 * 1000);
    const countdownInterval = setInterval(() => {
      setRefreshCountdown((prev) => (prev > 0 ? prev - 1 : 5 * 60));
    }, 1000);
    return () => {
      clearInterval(loadInterval);
      clearInterval(countdownInterval);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key;
      if (key === "1") setView("nhc");
      else if (key === "2") setView("accuweather");
      else if (key === "3") setView("ventusky");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setIframeLoading(true);
    const timer = setTimeout(() => setIframeLoading(false), 3000);
    return () => clearTimeout(timer);
  }, [view]);

  const storms = useMemo<NoaaStormAdvisoryItem[]>(() => {
    // 2024+ 优先 activeStorms；旧版 / 衍生版走 items
    const raw: (StormDict | NoaaStormAdvisoryItem)[] = [
      ...(Array.isArray(data?.activeStorms) ? data.activeStorms : []),
      ...(Array.isArray(data?.items) ? data.items : []),
    ];
    const normalized = raw.map((r) => normalize(r as StormDict));

    // 同一场风暴可能包含多条 advisory（不同产品），按 id/name+basin 去重，保留最新时间
    const bucket = new Map<string, NoaaStormAdvisoryItem[]>();
    for (const it of normalized) {
      const k =
        it.id ||
        (it.name || it.stormName || "UNNAMED") + "|" + (it.basinAbbrev || it.basin || "");
      const arr = bucket.get(k) ?? [];
      arr.push(it);
      bucket.set(k, arr);
    }

    const result: NoaaStormAdvisoryItem[] = [];
    for (const [, arr] of bucket) {
      arr.sort((a, b) => {
        const sa = a.maxWind != null ? 1 : 0;
        const sb = b.maxWind != null ? 1 : 0;
        if (sa !== sb) return sb - sa;
        const ua = a.url ? 1 : 0;
        const ub = b.url ? 1 : 0;
        if (ua !== ub) return ub - ua;
        return (
          new Date((b.updateTimeUTC || b.issuanceTimeUTC || "") + "Z").getTime() -
          new Date((a.updateTimeUTC || a.issuanceTimeUTC || "") + "Z").getTime()
        );
      });
      result.push(arr[0]);
    }

    result.sort((a, b) => {
      if (sortBy === "intensity") {
        return (b.maxWind ?? 0) - (a.maxWind ?? 0);
      }
      if (sortBy === "basin") {
        return (a.basinAbbrev || "").localeCompare(b.basinAbbrev || "");
      }
      if (sortBy === "time") {
        const ta = new Date((a.updateTimeUTC || a.issuanceTimeUTC || "") + "Z").getTime();
        const tb = new Date((b.updateTimeUTC || b.issuanceTimeUTC || "") + "Z").getTime();
        return tb - ta;
      }
      return 0;
    });

    return result;
  }, [data, sortBy]);

  const lastUpdateIso = useMemo<string | undefined>(() => {
    if (data?.updatedUTC) return data.updatedUTC;
    return latestUpdatedUtc(storms);
  }, [data, storms]);

  const activeSrc = VIEWS.find((v) => v.key === view)?.src ?? VIEWS[0].src;

  return (
    <div className="cyber-bg">
      <div className="container mx-auto flex min-h-screen max-w-[1440px] flex-col px-4 py-5 sm:px-6 lg:px-10">
        {/* ============== 顶栏 ============== */}
        <header className="flex w-full items-center justify-between pb-4 sm:pb-6">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl px-2 py-2 transition hover:bg-white/5 animate-fade-in-up"
            style={{ animationDelay: "20ms" }}
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-glow">
              <Home className="h-5 w-5 text-white" strokeWidth={2.2} />
              <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-[15px] font-bold tracking-wide text-ink sm:text-base">
                Navigator<span className="text-brand-gradient">Hub</span>
              </div>
              <div className="text-[11px] text-ink-muted">星际导航中心 · 气象灾害追踪</div>
            </div>
          </Link>
          <ThemeSwitcher />
        </header>

        {/* ============== 标题 + 状态 ============== */}
        <section className="mb-6 mt-2 sm:mb-8 sm:mt-4 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
          <div className="glass-card flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
                <CloudLightning className="h-7 w-7" strokeWidth={2} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
                    台风 / 风暴 实时预告
                  </h1>
                  <span
                    className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/90"
                    style={{ background: storms.length > 0 ? "rgba(220,38,38,.18)" : "rgba(16,185,129,.15)" }}
                  >
                    {loading ? "数据加载中…" : `${storms.length > 0 ? `活跃 ${storms.length}` : "当前无活跃风暴"}`}
                  </span>
                </div>
                <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                  国际化 3 合 1 视图：<b className="text-ink">NOAA NHC</b>（大西洋飓风 5 日官方路径图）、
                  <b className="text-ink">AccuWeather Tropical Asia</b>（西北太平洋 + 南海）、
                  <b className="text-ink">Ventusky</b> 全球热带气旋路径图层；
                  并从 NOAA <code className="rounded bg-white/5 px-1">CurrentStorms.json</code> 抓取全球活跃风暴的
                  中心坐标、风力、气压与 5 日预报。<span className="text-ink-subtle">每 5 分钟自动刷新</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={activeSrc}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-ink transition hover:border-white/20 hover:bg-white/10"
              >
                <ExternalLink className="h-3.5 w-3.5" /> 新窗口打开
              </a>
              <button
                type="button"
                onClick={() => void load(true)}
                disabled={refreshing || loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-gradient px-3 py-2 text-xs font-semibold text-white shadow-glow transition hover:shadow-glow-lg disabled:opacity-60"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "刷新中" : refreshCountdown > 0 ? `刷新数据（${Math.floor(refreshCountdown / 60)}:${(refreshCountdown % 60).toString().padStart(2, "0")}）` : "刷新数据"}
              </button>
            </div>
          </div>
        </section>

        {/* ============== Tab 栏 ============== */}
        <section className="mb-4 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <div className="glass-card inline-flex w-full flex-wrap items-center gap-2 p-2">
            {VIEWS.map((v, idx) => {
              const active = v.key === view;
              const shortcut = `${idx + 1}`;
              return (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setView(v.key)}
                  className={`relative flex flex-1 items-center justify-start gap-3 rounded-xl px-4 py-2.5 text-left transition sm:flex-none ${
                    active
                      ? "bg-brand-gradient text-white shadow-glow"
                      : "text-ink-muted hover:bg-white/5 hover:text-ink"
                  }`}
                >
                  <span className="text-lg">{v.icon}</span>
                  <span className="flex flex-col leading-tight">
                    <span className={`text-sm font-semibold ${active ? "" : "text-ink"}`}>
                      {v.label}
                    </span>
                    <span className={`text-[11px] ${active ? "text-white/85" : "text-ink-subtle"}`}>
                      {v.sub}
                      <span className="ml-1 opacity-60">({shortcut})</span>
                    </span>
                  </span>
                  {active && <MapIcon className="ml-auto h-4 w-4 opacity-80" strokeWidth={2} />}
                </button>
              );
            })}
          </div>
        </section>

        {/* ============== Iframe 可视化 ============== */}
        <section className="mb-6 animate-fade-in-up" style={{ animationDelay: "130ms" }}>
          <div className="glass-card overflow-hidden p-2">
            <div className="relative w-full overflow-hidden rounded-xl border border-white/10">
              {iframeLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--bg-base)]">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-brand-gradient" />
                    <div className="text-sm font-medium text-ink-muted">
                      加载地图数据…
                    </div>
                    <div className="h-1 w-32 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full w-1/3 animate-pulse bg-brand-gradient" />
                    </div>
                  </div>
                </div>
              )}
              <iframe
                key={view}
                title={`storm-view-${view}`}
                src={activeSrc}
                loading="lazy"
                referrerPolicy="no-referrer"
                allow="fullscreen"
                onLoad={() => setIframeLoading(false)}
                style={{ height: iframeHeight }}
                className="min-h-[460px] w-full border-0 bg-[var(--bg-base)]"
              />
              {/* 顶部小提示条 */}
              <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur">
                {VIEWS.find((v) => v.key === view)?.label} 官方路径图 · 若显示异常请点击「新窗口打开」
              </div>
            </div>
          </div>
        </section>

        {/* ============== NOAA 风暴列表 ============== */}
        <section className="mb-10 animate-fade-in-up" style={{ animationDelay: "160ms" }}>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2 px-1">
            <div className="flex flex-col gap-1.5">
              <h2 className="font-display text-lg font-bold text-ink sm:text-xl">全球活跃风暴（NOAA 数据源）</h2>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs text-ink-muted">
                  更新时间（北京时间）：
                  <span className="text-ink">
                    {loading ? "加载中…" : lastUpdateIso ? formatUtc(lastUpdateIso) : "—"}
                  </span>
                  <span className="ml-2 text-ink-subtle">
                    （平静期也会返回空数组，属正常；地图不依赖此接口）
                  </span>
                </p>
                {!loading && storms.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-medium text-ink-muted">排序：</span>
                    <button
                      onClick={() => setSortBy("intensity")}
                      className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition ${
                        sortBy === "intensity"
                          ? "bg-brand-gradient text-white"
                          : "bg-white/5 text-ink-muted hover:text-ink"
                      }`}
                    >
                      强度
                    </button>
                    <button
                      onClick={() => setSortBy("basin")}
                      className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition ${
                        sortBy === "basin"
                          ? "bg-brand-gradient text-white"
                          : "bg-white/5 text-ink-muted hover:text-ink"
                      }`}
                    >
                      海域
                    </button>
                    <button
                      onClick={() => setSortBy("time")}
                      className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition ${
                        sortBy === "time"
                          ? "bg-brand-gradient text-white"
                          : "bg-white/5 text-ink-muted hover:text-ink"
                      }`}
                    >
                      时间
                    </button>
                  </div>
                )}
              </div>
            </div>
            {err && (
              <div className="flex items-start gap-1.5 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <span>
                  NOAA 实时列表暂不可用（{err}）。
                  <br />
                  可能原因：浏览器 / 沙盒网络策略，或访问 nhc.noaa.gov 被拒绝。
                  <br />
                  地图模块不受影响；部署到公网（Netlify 等）后，真实浏览器通常可直接访问。
                </span>
              </div>
            )}
          </div>

          {loading && storms.length === 0 ? (
            <div className="glass-card grid gap-3 p-5 sm:grid-cols-2">
              {[0, 1].map((i) => (
                <div key={i} className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-3 h-5 w-1/2 rounded bg-white/10" />
                  <div className="space-y-2">
                    <div className="h-3 w-3/4 rounded bg-white/8" />
                    <div className="h-3 w-1/2 rounded bg-white/8" />
                    <div className="h-3 w-2/3 rounded bg-white/8" />
                  </div>
                </div>
              ))}
            </div>
          ) : storms.length === 0 ? (
            <div className="glass-card flex items-center gap-3 p-5 text-sm text-ink-muted">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                ✓
              </div>
              <div>
                目前 <b className="text-ink mx-1">NOAA 监测</b> 没有发布活跃风暴或热带扰动的正式预报。
                非飓风季（12–5 月）或全球平静期属正常现象。
                <br />
                您仍可在上方三个官方地图中查看历史路径、实时云图与中国西北太平洋台风。
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {storms.map((s, idx) => {
                const name = s.stormName || s.name || "未命名系统";
                const cls = s.classification || s.stormType || "热带扰动";
                const color = levelColor(cls);
                return (
                  <article
                    key={(s.id ?? name) + idx}
                    className="glass-card group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-glow"
                  >
                    {/* 顶条装饰 */}
                    <div
                      className="absolute inset-x-0 top-0 h-1"
                      style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
                    />

                    <header className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-glow"
                          style={{ background: `linear-gradient(135deg, ${color}, #0f172a)` }}
                        >
                          <Wind className="h-5 w-5" strokeWidth={2.2} />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="font-display text-lg font-bold text-ink">{name}</h3>
                            {s.basinAbbrev && (
                              <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-ink-muted">
                                {s.basinAbbrev}
                              </span>
                            )}
                          </div>
                          <div
                            className="mt-0.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
                            style={{ background: `${color}22`, color }}
                          >
                            {cls}
                          </div>
                        </div>
                      </div>
                      {s.advisoryNumber && (
                        <div className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-ink-muted">
                          #{s.advisoryNumber}
                        </div>
                      )}
                    </header>

                    <ul className="mb-4 space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink-subtle" />
                        <div>
                          <div className="text-[11px] text-ink-subtle">中心位置</div>
                          <div className="font-mono text-ink">{toCoord(s.center)}</div>
                        </div>
                      </li>
                      <li className="grid grid-cols-2 gap-2">
                        <div className="flex items-start gap-2 rounded-lg bg-white/[0.03] p-2">
                          <Wind className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                          <div>
                            <div className="text-[10px] text-ink-subtle">最大持续风</div>
                            <div className="font-semibold text-ink">
                              {s.maxWind != null ? `${s.maxWind} kt` : "—"}
                              {s.maxWind != null && (
                                <span className="ml-1 text-[10px] text-ink-subtle">
                                  （≈ {Math.round(s.maxWind * 1.852)} km/h）
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 rounded-lg bg-white/[0.03] p-2">
                          <ThermometerSun className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-400" />
                          <div>
                            <div className="text-[10px] text-ink-subtle">中心气压</div>
                            <div className="font-semibold text-ink">
                              {s.minimumPressure != null ? `${s.minimumPressure} hPa` : "—"}
                            </div>
                          </div>
                        </div>
                      </li>
                      <li className="grid grid-cols-2 gap-2">
                        <div className="flex items-start gap-2 rounded-lg bg-white/[0.03] p-2">
                          <Compass className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-400" />
                          <div>
                            <div className="text-[10px] text-ink-subtle">移动方向 / 速度</div>
                            <div className="font-semibold text-ink">
                              {bearingLabel(s.movementDeg)}
                              {s.movementSpeed != null ? ` ${s.movementSpeed} kt` : ""}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 rounded-lg bg-white/[0.03] p-2">
                          <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                          <div>
                            <div className="text-[10px] text-ink-subtle">预报发报（北京）</div>
                            <div className="font-semibold text-ink text-[12px]">
                              {formatUtc(s.updateTimeUTC)}
                            </div>
                          </div>
                        </div>
                      </li>
                    </ul>

                    {s.forecastText && (
                      <p className="mb-4 line-clamp-6 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-xs leading-relaxed text-ink-muted">
                        <span className="mr-1 font-semibold text-ink">官方 5 日预报：</span>
                        {s.forecastText}
                      </p>
                    )}

                    {(s.url || s.stormUrl) && (
                      <a
                        href={s.url || s.stormUrl || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-ink transition group-hover:border-white/20 group-hover:bg-brand-gradient group-hover:text-white group-hover:shadow-glow"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        查看 NOAA 官方产品页与全部公告
                      </a>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ============== 页脚说明 ============== */}
        <footer className="glass-card mb-6 p-4 text-[11px] leading-relaxed text-ink-subtle animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <div className="mb-1 flex flex-wrap items-center gap-2 text-ink-muted">
            <b className="text-ink">数据与地图来源（国际化视图）</b>
          </div>
          <ul className="list-disc space-y-0.5 pl-5">
            <li>🇺🇸 <b>NOAA NHC · gtwo 5-Day Graphic</b>（nhc.noaa.gov/gtwo.php）— 大西洋与东太平洋飓风官方 5 日路径与概率图，覆盖美/加/墨/中美洲</li>
            <li>🌏 <b>AccuWeather · Tropical Asia</b>（accuweather.com 热带天气亚洲分区）— 覆盖中国 / 南海 / 日本 / 菲律宾，原 CMA 中国气象局覆盖区完全一致；零 X-Frame-Options / 零 CSP frame-ancestors 限制，可直接 iframe；原 JMA 因 CSP frame-ancestors 仅允许日本政府域（mlit.go.jp / jma-net.go.jp 等）无法嵌入，已排除</li>
            <li>🌪️ <b>Ventusky</b>（ventusky.com）— 欧洲 CHMI 旗下全球气象可视化，热带气旋 5 日路径图层，覆盖全球 7 大海域</li>
            <li>列表数据：NOAA <code className="rounded bg-white/5 px-1">CurrentStorms.json</code>（每 5 分钟自动刷新）；旧版 CMA 中国气象台 & JTWC（navy.mil 国内 DNS 解析失败）已移除</li>
          </ul>
          <p className="mt-2">
            ⚠️ 本页仅供信息聚合与快速查阅；涉及防灾、出行、作业决策，请以属地官方气象台发布的预警信号为准。
          </p>
        </footer>
      </div>
    </div>
  );
}
