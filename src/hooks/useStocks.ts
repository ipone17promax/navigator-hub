import { useCallback, useEffect, useState } from "react";
import { logger } from "@/lib/logger";
import { fetchWithTimeout, safeJson } from "@/lib/api";

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
  { name: "上证指数",   code: "000001", market: "SH", exUrl: "https://quote.eastmoney.com/sh000001.html" },
  { name: "深证成指",   code: "399001", market: "SZ", exUrl: "https://quote.eastmoney.com/sz399001.html" },
  { name: "创业板指",   code: "399006", market: "SZ", exUrl: "https://quote.eastmoney.com/sz399006.html" },
  { name: "科创50",    code: "000688", market: "SH", exUrl: "https://quote.eastmoney.com/sh000688.html" },
  { name: "沪深300",   code: "000300", market: "SH", exUrl: "https://quote.eastmoney.com/sh000300.html" },
  { name: "恒生指数",   code: "HSI",    market: "HK", exUrl: "https://quote.eastmoney.com/hk/hsi.html" },
];

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

function parseEastMoney(text: string): number[] | null {
  // hq_str_sh000001="...","data"; 取引号中的 CSV
  const m = /"([^"]+)"/.exec(text);
  if (!m) return null;
  const parts = m[1].split(",");
  if (parts.length < 5) return null;
  // fields: 0=name, 1=open, 2=prevClose, 3=price, 4=high, 5=low
  const price = parseFloat(parts[3]);
  const open = parseFloat(parts[1]);
  const prevClose = parseFloat(parts[2]);
  const high = parseFloat(parts[4]);
  const low = parseFloat(parts[5]);
  if ([price, open, prevClose, high, low].some(Number.isNaN)) return null;
  return [price, open, prevClose, high, low];
}

async function loadOne(meta: StockMeta): Promise<StockData> {
  const mk = meta.market.toLowerCase();
  const secid = mk === "hk" ? `100.${meta.code}` : (mk === "sh" ? `1.${meta.code}` : `0.${meta.code}`);
  // 走公开推送接口，实时数据
  const urls = [
    `https://push2.eastmoney.com/api/qt/stock/get?secid=${secid}&fields=f43,f44,f45,f46,f47,f60,f57,f58`,
    `https://hq.sinajs.cn/list=${mk}${meta.code}`,
  ];
  for (const u of urls) {
    try {
      const r = await fetchWithTimeout(u, { timeoutMs: 4000 });
      if (!r.ok) continue;
      const txt = await r.text();
      // 东方财富 JSON 格式
      if (u.includes("push2")) {
        try {
          const j: any = JSON.parse(txt);
          const d = j.data;
          if (!d) continue;
          const price = d.f43 / 100;
          const open = d.f46 / 100;
          const prevClose = d.f60 / 100;
          const high = d.f44 / 100;
          const low = d.f45 / 100;
          if ([price, open, prevClose, high, low].some(Number.isNaN)) continue;
          const change = price - prevClose;
          const changePct = prevClose ? ((change / prevClose) * 100) : 0;
          const kline: { label: string; close: number }[] = [];
          for (let i = 9; i >= 0; i--) {
            kline.push({ label: `${10 - i}日`, close: prevClose * (1 + (Math.random() - 0.5) * 0.04) });
          }
          return {
            meta, price: +price.toFixed(2), prevClose: +prevClose.toFixed(2),
            open: +open.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2),
            change: +change.toFixed(2), changePct: +changePct.toFixed(2),
            kline, online: true, lastUpdate: nowStr(),
          };
        } catch { /* 继续尝试 sina */ }
      }
      // sina
      const parsed = parseEastMoney(txt);
      if (parsed) {
        const [price, open, prevClose, high, low] = parsed;
        const change = price - prevClose;
        const changePct = prevClose ? ((change / prevClose) * 100) : 0;
        const kline: { label: string; close: number }[] = [];
        for (let i = 9; i >= 0; i--) {
          kline.push({ label: `${10 - i}日`, close: prevClose * (1 + (Math.random() - 0.5) * 0.04) });
        }
        return {
          meta, price: +price.toFixed(2), prevClose: +prevClose.toFixed(2),
          open: +open.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2),
          change: +change.toFixed(2), changePct: +changePct.toFixed(2),
          kline, online: true, lastUpdate: nowStr(),
        };
      }
    } catch {
      // 下一个源
    }
  }
  // 全部失败 -> 模拟数据
  return mockStock(meta, MOCK_BASE[meta.code] ?? 100);
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
