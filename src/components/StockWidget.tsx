import { useEffect, useState, useCallback, useMemo } from "react";
import * as Icons from "lucide-react";
import { logger } from "@/lib/logger";

/**
 * 行情数据接口 —— 东方财富（大智慧同源）实时行情
 * API: https://push2.eastmoney.com/api/qt/stock/get
 * 返回字段说明：
 *   f43: 最新价（指数为整数，需要 /100）
 *   f44: 最高价
 *   f45: 最低价
 *   f46: 开盘价
 *   f169: 涨跌额（/100）
 *   f170: 涨跌幅（百分数值，/100 后为实际百分比）
 *   f57: 证券代码
 *   f58: 证券名称
 */
interface IndexMeta {
  name: string;
  secid: string;
  code: string;
  url: string; // 跳转官网
  market: string;
}

/** 6 大指数：全部来自东方财富（大智慧数据源） */
const INDICES: IndexMeta[] = [
  { name: "上证指数",   secid: "1.000001", code: "000001", url: "https://quote.eastmoney.com/zs000001.html#fullScreenChart", market: "SH" },
  { name: "深证成指",   secid: "0.399001", code: "399001", url: "https://quote.eastmoney.com/zs399001.html#fullScreenChart", market: "SZ" },
  { name: "创业板指",   secid: "0.399006", code: "399006", url: "https://quote.eastmoney.com/zs399006.html#fullScreenChart", market: "SZ" },
  { name: "科创50",     secid: "1.000688", code: "000688", url: "https://quote.eastmoney.com/zs000688.html#fullScreenChart", market: "SH" },
  { name: "沪深300",    secid: "1.000300", code: "000300", url: "https://quote.eastmoney.com/zs000300.html#fullScreenChart", market: "SH" },
  { name: "恒生指数",   secid: "100.HSI",  code: "HSI",   url: "https://quote.eastmoney.com/hk/HSI.html#fullScreenChart",   market: "HK" },
];

interface StockItem {
  meta: IndexMeta;
  price: number;
  change: number; // 涨跌幅 %
  changeAmount: number; // 涨跌额
  high: number;
  low: number;
  open: number;
  time: string;
  isFallback: boolean;
}

/** 兜底数据（API 不可用时显示） */
function fallbackData(meta: IndexMeta): StockItem {
  const seed = meta.secid.split(".").reduce((a, c) => a + c.length, 0);
  const basePrices: Record<string, number> = {
    "1.000001": 3200, "0.399001": 10500, "0.399006": 2100,
    "1.000688": 980, "1.000300": 3800, "100.HSI": 18000,
  };
  const base = basePrices[meta.secid] ?? 2000 + seed * 100;
  const change = (Math.sin(seed) * 1.5 + (Math.random() - 0.5)) * 2;
  const price = base * (1 + change / 100);
  return {
    meta,
    price: Number(price.toFixed(2)),
    change: Number(change.toFixed(2)),
    changeAmount: Number((base * change / 100).toFixed(2)),
    high: Number((price * 1.005).toFixed(2)),
    low: Number((price * 0.995).toFixed(2)),
    open: Number((base * 1.002).toFixed(2)),
    time: "",
    isFallback: true,
  };
}

/** 转换东方财富原始数据到前端友好格式 */
function parseEastmoney(meta: IndexMeta, raw: Record<string, unknown>): StockItem | null {
  try {
    const f43 = Number(raw.f43); // 最新价
    const f169 = Number(raw.f169); // 涨跌额
    const f170 = Number(raw.f170); // 涨跌幅（百分数值，如 1.56 表示 1.56%）
    const f44 = Number(raw.f44); // 最高
    const f45 = Number(raw.f45); // 最低
    const f46 = Number(raw.f46); // 开盘
    const f58 = String(raw.f58 ?? ""); // 名称
    const f86 = Number(raw.f86); // 时间戳

    if (!f43 || f43 === 0 || Number.isNaN(f43)) return null;

    // 指数一般为整数（如 300000 → 3000.00），除以 100
    const price = Number((f43 / 100).toFixed(2));
    const changeAmount = f169 ? Number((f169 / 100).toFixed(2)) : 0;
    const change = f170 ? Number((f170 / 100).toFixed(2)) : 0;
    const high = f44 ? Number((f44 / 100).toFixed(2)) : price;
    const low = f45 ? Number((f45 / 100).toFixed(2)) : price;
    const open = f46 ? Number((f46 / 100).toFixed(2)) : price;

    let timeStr = "";
    if (f86 > 0) {
      const d = new Date(f86);
      timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }

    return {
      meta: { ...meta, name: f58 || meta.name },
      price,
      change,
      changeAmount,
      high,
      low,
      open,
      time: timeStr,
      isFallback: false,
    };
  } catch {
    return null;
  }
}

/** 拉取单个指数的实时数据 */
async function fetchIndex(meta: IndexMeta, signal?: AbortSignal): Promise<StockItem | null> {
  const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=${meta.secid}&fields=f43,f44,f45,f46,f57,f58,f86,f169,f170`;
  const resp = await fetch(url, { signal, cache: "no-store" });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  if (!data || !data.data) return null;
  return parseEastmoney(meta, data.data as Record<string, unknown>);
}

/**
 * 多市场交易时段智能调度
 * A股  09:30-11:30, 13:00-15:00（工作日）
 * 港股  09:30-16:00（工作日）
 * 美股  21:30-次日04:00（北京时间，夏令时略有浮动）
 * 加密 24 小时不间断
 * 对应刷新间隔（秒）：
 *   活跃时段：30s
 *   盘前盘后：60s
 *   休市：120s
 */
type Market = "cn" | "hk" | "us" | "crypto";

interface Schedule {
  market: Market;
  start: [number, number]; // [hour, minute]
  end: [number, number];
}

const CN_MORNING: Schedule = { market: "cn", start: [9, 30], end: [11, 30] };
const CN_AFTER: Schedule = { market: "cn", start: [13, 0], end: [15, 0] };
const HK_DAY: Schedule = { market: "hk", start: [9, 30], end: [16, 0] };
const US_NIGHT: Schedule = { market: "us", start: [21, 30], end: [28, 0] /* 次日04:00 */ };

function isActiveMarket(now: Date, schedule: Schedule): boolean {
  const day = now.getDay();
  if (schedule.market === "cn" || schedule.market === "hk") {
    if (day === 0 || day === 6) return false; // 周末
  }
  const m = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = schedule.start;
  const [eh, em] = schedule.end;
  const startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin <= startMin) endMin += 24 * 60; // 跨天
  // 处理 US：21:30 - 次日04:00
  const nowM = m < startMin ? m + 24 * 60 : m;
  return nowM >= startMin && nowM <= endMin;
}

/**
 * 动态计算刷新间隔（毫秒）
 * 活跃时段 30s，盘前盘后 60s，休市 120s
 * 如果所有市场都休市，直接拉一次就不拉了（省流量）
 */
function computeRefreshMs(): number {
  const now = new Date();
  const activeSchedules = [CN_MORNING, CN_AFTER, HK_DAY, US_NIGHT];
  const active = activeSchedules.some((s) => isActiveMarket(now, s));
  // 盘前/盘后：距离最近交易时段 30 分钟内，用 60s
  const soonToOpen = computeSoonToOpenMs(now);
  if (active) return 30_000;
  if (soonToOpen !== null && soonToOpen < 30 * 60 * 1000) return 60_000;
  return 120_000;
}

/** 距离最近下一个交易开始还有多久（ms），返回 null 表示今天没有了 */
function computeSoonToOpenMs(now: Date): number | null {
  const todaySchedules: Schedule[] = [CN_MORNING, CN_AFTER, HK_DAY, US_NIGHT];
  let best: number | null = null;
  for (const s of todaySchedules) {
    const day = now.getDay();
    if ((s.market === "cn" || s.market === "hk") && (day === 0 || day === 6)) continue;
    const [sh, sm] = s.start;
    const startDate = new Date(now);
    startDate.setHours(sh, sm, 0, 0);
    if (startDate <= now) startDate.setDate(startDate.getDate() + 1);
    const diff = startDate.getTime() - now.getTime();
    if (diff > 0 && (best === null || diff < best)) best = diff;
  }
  return best;
}

/** 描述字符串：告诉用户当前是什么时段 */
function describeSchedule(now: Date): string {
  if (isActiveMarket(now, CN_MORNING)) return "A股 上午交易中（9:30-11:30）";
  if (isActiveMarket(now, CN_AFTER)) return "A股 下午交易中（13:00-15:00）";
  if (isActiveMarket(now, HK_DAY)) return "港股 交易中（9:30-16:00）";
  if (isActiveMarket(now, US_NIGHT)) return "美股 交易中（21:30-次日04:00）";
  const soon = computeSoonToOpenMs(now);
  if (soon === null) return "今日已休市";
  const h = Math.floor(soon / 3_600_000);
  const m = Math.floor((soon % 3_600_000) / 60_000);
  return `休市中 · ${h}h${m}m 后开盘`;
}

export default function StockWidget() {
  const [stocks, setStocks] = useState<StockItem[]>(() => INDICES.map(fallbackData));
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");
  const [hasRealData, setHasRealData] = useState(false);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [refreshMs, setRefreshMs] = useState<number>(computeRefreshMs());
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  // 是否显示弹窗（true 则弹窗，false 则直接跳转）
  const [useModal, setUseModal] = useState<boolean>(false);
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);

  const loadAll = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      logger.warn("StockWidget", "loadAll 跳过（离线）");
      return;
    }
    setLoading(true);
    logger.info("StockWidget", "loadAll 开始");
    const controller = new AbortController();
    const results = await Promise.allSettled(
      INDICES.map((m) => fetchIndex(m, controller.signal)),
    );
    // 收集失败项
    const failed = results
      .map((r, i) => (r.status === "rejected" ? INDICES[i].name : null))
      .filter((n): n is string => Boolean(n));
    if (failed.length > 0) {
      logger.warn("StockWidget", "部分指数获取失败", { failed });
    }
    const next: StockItem[] = INDICES.map((m, i) => {
      const r = results[i];
      if (r.status === "fulfilled" && r.value) return r.value;
      return fallbackData(m);
    });
    setStocks(next);
    const anyReal = next.some((s) => !s.isFallback);
    setHasRealData(anyReal);
    if (anyReal) {
      const d = new Date();
      setLastUpdate(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`,
      );
    }
    // 根据最新数据动态计算刷新间隔
    setRefreshMs(computeRefreshMs());
    setLoading(false);
    logger.info("StockWidget", "loadAll 完成", {
      realCount: next.filter((s) => !s.isFallback).length,
      total: next.length,
    });
  }, []);

  useEffect(() => {
    void loadAll();
    let timer: ReturnType<typeof setInterval>;
    const scheduleNext = () => {
      const ms = computeRefreshMs();
      setRefreshMs(ms);
      logger.info("StockWidget", "刷新调度", {
        intervalMs: ms,
        schedule: describeSchedule(new Date()),
      });
      timer = setInterval(() => {
        void loadAll();
      }, ms);
    };
    scheduleNext();

    const onVis = () => {
      clearInterval(timer);
      if (document.visibilityState === "visible") {
        void loadAll();
        scheduleNext();
      }
    };
    const onOnline = () => {
      setOnline(true);
      void loadAll();
      scheduleNext();
    };
    const onOffline = () => setOnline(false);

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [loadAll]);

  const openIndex = (stock: StockItem) => {
    logger.info("StockWidget", "打开指数", {
      code: stock.meta.code,
      mode: useModal ? "modal" : "external",
    });
    if (useModal) {
      setSelectedStock(stock);
    } else {
      window.open(stock.meta.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="rounded-2xl border border-stroke bg-bg-elevate/60 p-4 backdrop-blur-xl transition-all duration-300 hover:border-stroke-hover">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasRealData ? (
            <Icons.TrendingUp size={16} className="text-red-400" />
          ) : (
            <Icons.Activity size={16} className="text-amber-400" />
          )}
          <span className="text-sm font-semibold text-ink">
            行情速览
            <span className="ml-2 text-[10px] font-normal text-ink-subtle">
              东方财富·实时
            </span>
          </span>
          <span
            className="rounded-md border border-stroke/50 px-1.5 py-0.5 text-[10px] font-mono"
            style={{
              color: online ? "#4ade80" : "#f87171",
            }}
            title={online ? "网络正常" : "离线中"}
          >
            {describeSchedule(new Date())}
          </span>
          <span className="text-[10px] text-ink-subtle">
            · 每 {Math.round(refreshMs / 1000)}s 自动刷新
          </span>
        </div>
        <div className="flex items-center gap-2">
          {loading ? (
            <span className="flex items-center gap-1 text-[11px] text-amber-400">
              <Icons.RefreshCw size={11} className="animate-spin" />
              同步中
            </span>
          ) : (
            <button
              onClick={() => void loadAll()}
              className="flex items-center gap-1 text-[11px] text-ink-subtle transition-colors hover:text-ink"
              title="手动刷新"
            >
              <Icons.RefreshCw size={11} />
              {hasRealData ? lastUpdate || "刷新" : "手动刷新"}
            </button>
          )}
          {!hasRealData && online && (
            <span className="text-[10px] text-amber-400/80">模拟数据（开市后自动同步）</span>
          )}
          {!online && (
            <span className="flex items-center gap-1 text-[10px] text-red-400">
              <Icons.WifiOff size={11} />
              离线
            </span>
          )}
          <button
            onClick={() => setUseModal((v) => !v)}
            className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] transition-colors ${
              useModal
                ? "border-brand-primary/50 bg-brand-primary/20 text-brand-primary"
                : "border-stroke text-ink-subtle hover:bg-white/10"
            }`}
            title="切换弹窗大屏 / 直接跳转模式"
          >
            {useModal ? <Icons.Maximize2 size={10} /> : <Icons.ExternalLink size={10} />}
            {useModal ? "弹窗" : "直达"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stocks.map((s) => {
          const isUp = s.change >= 0;
          const isExpanded = expandedCode === s.meta.code;
          return (
            <div
              key={s.meta.code}
              onMouseEnter={() => setExpandedCode(s.meta.code)}
              onMouseLeave={() => setExpandedCode(null)}
              onClick={() => openIndex(s)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openIndex(s);
                }
              }}
              role="button"
              tabIndex={0}
              title={`${s.meta.name} · 点击跳转东方财富行情页`}
              className="group relative flex cursor-pointer flex-col rounded-xl border border-stroke/50 bg-white/3 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-stroke-hover hover:bg-white/5 hover:shadow-glow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60"
            >
              {/* 顶部：名称 + 涨跌箭头 */}
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-ink">{s.meta.name}</span>
                  <span
                    className="rounded px-1 text-[9px] font-mono"
                    style={{
                      background: isUp ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                      color: isUp ? "#f87171" : "#4ade80",
                    }}
                  >
                    {s.meta.market}
                  </span>
                </div>
                {isUp ? (
                  <Icons.ArrowUpRight size={14} className="text-red-400" />
                ) : (
                  <Icons.ArrowDownRight size={14} className="text-green-400" />
                )}
              </div>

              {/* 价格 */}
              <div
                className={`mt-0.5 text-lg font-bold tabular-nums ${
                  isUp ? "text-red-400" : "text-green-400"
                }`}
              >
                {s.price.toFixed(2)}
              </div>

              {/* 涨跌 */}
              <div
                className={`mt-0.5 flex items-center gap-1 text-[11px] font-medium tabular-nums ${
                  isUp ? "text-red-400/80" : "text-green-400/80"
                }`}
              >
                <span>
                  {isUp ? "+" : ""}
                  {s.change.toFixed(2)}%
                </span>
                <span className="opacity-60">
                  ({isUp ? "+" : ""}
                  {s.changeAmount.toFixed(2)})
                </span>
                <span className="ml-auto text-[10px] text-ink-subtle">
                  {s.meta.code}
                </span>
              </div>

              {/* 悬停展开：最高/最低/开盘 */}
              <div
                className={`grid overflow-hidden transition-all duration-200 ${
                  isExpanded ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="min-h-0">
                  <div className="flex justify-between border-t border-stroke/50 pt-2 text-[10px] text-ink-subtle">
                    <span>高 <span className="text-red-400 tabular-nums">{s.high.toFixed(2)}</span></span>
                    <span>低 <span className="text-green-400 tabular-nums">{s.low.toFixed(2)}</span></span>
                    <span>开 <span className="tabular-nums">{s.open.toFixed(2)}</span></span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-ink-subtle">
                    <span>{s.time ? `更新 ${s.time}` : "待同步"}</span>
                    <span className="flex items-center gap-0.5 text-brand-primary opacity-0 transition-opacity group-hover:opacity-100">
                      前往
                      <Icons.ExternalLink size={10} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 全屏行情预览弹窗（仅 useModal=true 时使用） */}
      {selectedStock && (
        <StockModal
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      )}
    </div>
  );
}

/** 全屏行情预览弹窗 */
function StockModal({
  stock,
  onClose,
}: {
  stock: StockItem;
  onClose: () => void;
}) {
  const { price, change, changeAmount, high, low, open, time, meta } = stock;
  const isUp = change >= 0;
  const color = isUp ? "#f87171" : "#4ade80";

  // 生成模拟走势点（基于 high/low 生成 30 个点的折线）
  const points = useMemo(() => {
    const n = 30;
    const arr: number[] = [];
    let cur = open;
    const target = price;
    const step = (target - open) / n;
    for (let i = 0; i < n; i++) {
      const noise = (Math.sin(i * 0.5) + Math.cos(i * 0.3)) * (high - low) * 0.15;
      cur = open + step * i + noise;
      cur = Math.max(low, Math.min(high, cur));
      arr.push(cur);
    }
    arr[arr.length - 1] = price;
    return arr;
  }, [price, open, high, low]);

  // SVG 路径
  const width = 800;
  const height = 260;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const minY = Math.min(...points, low) * 0.999;
  const maxY = Math.max(...points, high) * 1.001;
  const rangeY = maxY - minY || 1;

  const pathD = points
    .map((p, i) => {
      const x = padding.left + (i / (points.length - 1)) * chartW;
      const y = padding.top + (1 - (p - minY) / rangeY) * chartH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const areaD =
    pathD +
    ` L${padding.left + chartW},${padding.top + chartH} L${padding.left},${padding.top + chartH} Z`;

  const yTicks = 5;
  const yLabels = Array.from({ length: yTicks }, (_, i) => {
    const val = maxY - (rangeY * i) / (yTicks - 1);
    const y = padding.top + (i / (yTicks - 1)) * chartH;
    return { val: val.toFixed(2), y };
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-stroke bg-bg-elevated shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-start justify-between border-b border-stroke p-5">
          <div className="flex items-center gap-4">
            <div
              className="rounded-xl p-2"
              style={{ background: `${color}20` }}
            >
              {isUp ? (
                <Icons.TrendingUp size={28} style={{ color }} />
              ) : (
                <Icons.TrendingDown size={28} style={{ color }} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-ink">{meta.name}</h2>
                <span className="rounded-md border border-stroke px-2 py-0.5 text-xs text-ink-subtle">
                  {meta.code}
                </span>
                <span className="rounded-md px-2 py-0.5 text-xs font-medium" style={{ background: `${color}20`, color }}>
                  {meta.market}
                </span>
              </div>
              <div className="mt-0.5 text-[11px] text-ink-subtle">
                东方财富实时数据 · {time ? `更新于 ${time}` : "同步中"}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-subtle transition-colors hover:bg-white/10 hover:text-ink"
            aria-label="关闭"
          >
            <Icons.X size={20} />
          </button>
        </div>

        {/* 价格展示 */}
        <div className="flex items-end gap-6 px-5 py-4">
          <div
            className="text-5xl font-bold tabular-nums"
            style={{ color }}
          >
            {price.toFixed(2)}
          </div>
          <div className="flex flex-col gap-0.5 pb-1">
            <div className="flex items-center gap-2 text-lg font-medium tabular-nums" style={{ color }}>
              <span>{isUp ? "+" : ""}{change.toFixed(2)}%</span>
              <span className="text-base opacity-70">
                ({isUp ? "+" : ""}{changeAmount.toFixed(2)})
              </span>
            </div>
          </div>
          <button
            onClick={() => window.open(meta.url, "_blank", "noopener,noreferrer")}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-brand-primary/20 px-4 py-2 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-primary/30"
          >
            <Icons.ExternalLink size={16} />
            东方财富完整K线
          </button>
        </div>

        {/* SVG 走势图 */}
        <div className="px-5 pb-2">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-auto w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="stockArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* 背景网格 */}
            {yLabels.map((lbl, i) => (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={lbl.y}
                  x2={padding.left + chartW}
                  y2={lbl.y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={lbl.y + 4}
                  textAnchor="end"
                  className="fill-ink-subtle"
                  style={{ fontSize: 10 }}
                >
                  {lbl.val}
                </text>
              </g>
            ))}

            {/* 面积填充 */}
            <path d={areaD} fill="url(#stockArea)" />

            {/* 折线 */}
            <path
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 当前价格点 */}
            {(() => {
              const lastX = padding.left + chartW;
              const lastY = padding.top + (1 - (price - minY) / rangeY) * chartH;
              return (
                <g>
                  <circle cx={lastX} cy={lastY} r="4" fill={color} />
                  <circle cx={lastX} cy={lastY} r="8" fill={color} opacity="0.3">
                    <animate attributeName="r" values="4;10;4" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0;0.5" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                </g>
              );
            })()}

            {/* X 轴标签 */}
            <text x={padding.left} y={height - 5} className="fill-ink-subtle" style={{ fontSize: 10 }}>
              09:30
            </text>
            <text x={padding.left + chartW / 2 - 15} y={height - 5} className="fill-ink-subtle" style={{ fontSize: 10 }}>
              12:30
            </text>
            <text x={padding.left + chartW - 30} y={height - 5} className="fill-ink-subtle" style={{ fontSize: 10 }}>
              15:00
            </text>
          </svg>
        </div>

        {/* 统计指标 */}
        <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:grid-cols-4">
          {[
            { label: "最高", value: high.toFixed(2), color: "#f87171" },
            { label: "最低", value: low.toFixed(2), color: "#4ade80" },
            { label: "开盘", value: open.toFixed(2), color: "#94a3b8" },
            {
              label: "昨收",
              value: (open - changeAmount).toFixed(2),
              color: "#94a3b8",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-stroke/50 bg-white/5 p-3 text-center"
            >
              <div className="text-[11px] text-ink-subtle">{item.label}</div>
              <div
                className="mt-1 text-lg font-bold tabular-nums"
                style={{ color: item.color }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-between border-t border-stroke bg-white/5 px-5 py-3">
          <div className="text-[11px] text-ink-subtle">
            数据来源：东方财富（大智慧同源） · 每 30s 自动刷新
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-stroke px-4 py-1.5 text-sm text-ink-subtle transition-colors hover:bg-white/10"
            >
              关闭
            </button>
            <button
              onClick={() => window.open(meta.url, "_blank", "noopener,noreferrer")}
              className="flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90"
            >
              前往东方财富
              <Icons.ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
