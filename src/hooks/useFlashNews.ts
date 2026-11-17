import { useCallback, useEffect, useState } from "react";
import { safeJson } from "@/lib/api";

export interface HotItem {
  title: string;
  hot: number;
  link: string;
}

const CACHE_KEY = "nh.flash.cache.v1";
const TTL = 30 * 60 * 1000;

interface CacheShape {
  at: number;
  date: string;
  flash: string[];
  hot: HotItem[];
}

/**
 * 今日快讯 + 微博热搜
 *   数据源：60s API（开源，允许跨域），30 分钟内复用 sessionStorage
 *   失败时不伪造内容，交给组件显示重试
 */
export function useFlashNews() {
  const [flash, setFlash] = useState<string[]>([]);
  const [hot, setHot] = useState<HotItem[]>([]);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);

  const load = useCallback(async (force = false) => {
    if (!force) {
      try {
        const c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null") as CacheShape | null;
        if (c && Date.now() - c.at < TTL && c.flash.length) {
          setFlash(c.flash);
          setHot(c.hot);
          setDate(c.date);
          return;
        }
      } catch {
        /* 缓存损坏时忽略 */
      }
    }
    setLoading(true);
    setErr(false);
    try {
      const [a, b] = await Promise.all([
        safeJson<any>("https://60s.viki.moe/v2/60s", { timeoutMs: 8000 }),
        safeJson<any>("https://60s.viki.moe/v2/weibo", { timeoutMs: 8000 }),
      ]);
      const f: string[] = Array.isArray(a?.data?.news) ? a.data.news.map((x: unknown) => String(x)) : [];
      const h: HotItem[] = Array.isArray(b?.data)
        ? b.data
            .map((x: any) => ({ title: String(x?.title || ""), hot: Number(x?.hot_value || 0), link: String(x?.link || "") }))
            .filter((x: HotItem) => x.title)
        : [];
      if (!f.length && !h.length) throw new Error("empty");
      const d = String(a?.data?.date || "");
      setFlash(f);
      setHot(h);
      setDate(d);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), date: d, flash: f, hot: h } satisfies CacheShape));
    } catch {
      setErr(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { flash, hot, date, loading, err, load };
}
