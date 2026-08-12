import { useCallback, useEffect, useState } from "react";
import { logger } from "@/lib/logger";
import { fetchWithTimeout } from "@/lib/api";

export interface StockMeta {
  name: string;
  code: string;
  market: string;
  exUrl: string;
}

export interface StockData {
  meta: StockMeta;
  price: number;
  prevClose: number;
  open: number;
  high: number;
  low: number;
  change: number;
  changePct: number;
  kline: { label: string; close: number }[];
  online: boolean;
  lastUpdate: string;
}

const META: StockMeta[] = [
  { name: "上证指数",  code: "000001", market: "SH", exUrl: "https://quote.eastmoney.com/sh000001.html" },
  { name: "深证成指",  code: "399001", market: "SZ", exUrl: "https://quote.eastmoney.com/sz399001.html" },
  { name: "创业板指",  code: "399006", market: "SZ", exUrl: "https://quote.eastmoney.com/sz399006.html" },
  { name: "科创50",   code: "000688", market: "SH", exUrl: "https://quote.eastmoney.com/sh000688.html" },
  { name: "沪深300",  code: "000300", market: "SH", exUrl: "https://quote.eastmoney.com/sh000300.html" },
  { name: "恒生指数",  code: "HSI",    market: "HK", exUrl: "https://quote.eastmoney.com/hk/hsi.html" },
];

/** secid 映射：东方财富的 secid 格式为 market.code */
function secid(meta: StockMeta): string {
  if (meta.market === "HK") return "100." + meta.code;
  if (meta.market === "SH") return "1." + meta.code;
  return "0." + meta.code;
}

function nowStr(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function mockStock(meta: StockMeta, basePrice: number): StockData {
  const change = (Math.random() - 0.5) * 0.02 * basePrice;
  const pct = (change / basePrice) * 100;
  const kline: { label: string; close: number }[] = [];
  for (let i = 9; i >= 0; i--) {
    kline.push({ label: `${10 - i}日`, close: basePrice * (1 + (Math.random() - 0.5) * 0.06) });
  }
  return {
    meta,
    price: +(basePrice + change).toFixed(2),
    prevClose: basePrice,
    open: +(basePrice * (1 + (Math.random() - 0.5) * 0.005)).toFixed(2),
    high: +(basePrice * (1 + Math.random() * 0.01)).toFixed(2),
    low: +(basePrice * (1 - Math.random() * 0.01)).toFixed(2),
    change: +change.toFixed(2),
    changePct: +pct.toFixed(2),
    kline,
    online: false,
    lastUpdate: nowStr(),
  };
}

const MOCK_BASE: Record<string, number> = {
  "000001": 3900, "399001": 14200, "399006": 3500,
  "000688": 1700, "000300": 4650, HSI: 25500,
};

/**
 * 用 push2his.eastmoney.com 的 kline 接口拿真实行情
 * 该接口支持 CORS（push2his 域名比 push2 域名宽松）
 * K 线格式：日期,开盘,收盘,最高,最低,成交量
 */
async function loadOne(meta: StockMeta): Promise<StockData> {
  const sid = secid(meta);
  const end = new Date();
  const beg = new Date(end.getTime() - 30 * 24 * 3600 * 1000);
  const fmt = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const url =
    `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${sid}` +
    `&fields1=f1,f2,f3&fields2=f51,f52,f53,f54,f55,f56` +
    `&klt=101&fqt=0&beg=${fmt(beg)}&end=${fmt(end)}`;

  try {
    const r = await fetchWithTimeout(url, { timeoutMs: 6000 });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j: any = await r.json();
    const klines: string[] = j?.data?.klines;
    if (!klines || klines.length < 2) throw new Error("no kline data");

    // 解析最近 10 条 K 线
    const recent = klines.slice(-10);
    const kline: { label: string; close: number }[] = recent.map((k, i) => {
      const parts = k.split(",");
      return { label: `${i + 1}`, close: parseFloat(parts[2]) };
    });

    // 最新一条 = 今天
    const latest = klines[klines.length - 1].split(",");
    const prev = klines[klines.length - 2].split(",");
    const price = parseFloat(latest[2]);   // 收盘
    const open = parseFloat(latest[1]);     // 开盘
    const high = parseFloat(latest[3]);     // 最高
    const low = parseFloat(latest[4]);      // 最低
    const prevClose = parseFloat(prev[2]);  // 昨日收盘
    const change = price - prevClose;
    const changePct = prevClose ? ((change / prevClose) * 100) : 0;

    logger.info("useStocks", "真实行情获取成功", { name: meta.name, price, prevClose });
    return {
      meta,
      price: +price.toFixed(2),
      prevClose: +prevClose.toFixed(2),
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      change: +change.toFixed(2),
      changePct: +changePct.toFixed(2),
      kline,
      online: true,
      lastUpdate: nowStr(),
    };
  } catch (e) {
    logger.warn("useStocks", "行情获取失败，回退模拟", { name: meta.name, err: (e as Error)?.message });
    return mockStock(meta, MOCK_BASE[meta.code] ?? 100);
  }
}

export function useStocks() {
  const [stocks, setStocks] = useState<StockData[]>(() => META.map((m) => mockStock(m, MOCK_BASE[m.code] ?? 100)));
  const [loading, setLoading] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    logger.info("useStocks", "开始同步行情", { count: META.length });
    const out = await Promise.all(META.map(loadOne));
    setStocks(out);
    setLoading(false);
    const ok = out.filter((s) => s.online).length;
    logger.info("useStocks", "行情同步完成", { online: ok, total: out.length });
  }, []);

  useEffect(() => {
    void loadAll();
    const t = setInterval(() => void loadAll(), 60 * 1000);
    return () => clearInterval(t);
  }, [loadAll]);

  const hasRealData = stocks.some((s) => s.online);
  const online = stocks.length > 0;

  return { stocks, loading, loadAll, hasRealData, online, metaList: META };
}
