import { useCallback, useEffect, useState } from "react";
import { safeJson } from "@/lib/api";

export interface HotItem {
  title: string;
  hot: number;
  link: string;
}

const CACHE_KEY = "nh.flash.cache.v2";
const TTL = 30 * 60 * 1000;

interface CacheShape {
  at: number;
  date: string;
  flash: string[];
  hot: HotItem[];
}

function readCache(): CacheShape | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as CacheShape;
    return c && Array.isArray(c.flash) && c.flash.length ? c : null;
  } catch {
    return null;
  }
}

function writeCache(data: CacheShape) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* 隐私模式或配额满时忽略 */
  }
}

/** 主源：60s API（允许跨域，但公共实例可能 429 限流） */
async function fetchFrom60s(): Promise<{ flash: string[]; hot: HotItem[]; date: string }> {
  const [a, b] = await Promise.all([
    safeJson<any>("https://60s.viki.moe/v2/60s", { timeoutMs: 8000 }),
    safeJson<any>("https://60s.viki.moe/v2/weibo", { timeoutMs: 8000 }),
  ]);
  const flash: string[] = Array.isArray(a?.data?.news) ? a.data.news.map((x: unknown) => String(x)) : [];
  const hot: HotItem[] = Array.isArray(b?.data)
    ? b.data
        .map((x: any) => ({ title: String(x?.title || ""), hot: Number(x?.hot_value || 0), link: String(x?.link || "") }))
        .filter((x: HotItem) => x.title)
    : [];
  if (!flash.length && !hot.length) throw new Error("empty");
  return { flash, hot, date: String(a?.data?.date || "") };
}

/** 备源：RSS 桥接（60s 限流时提供真实新闻标题） */
async function fetchFromRss(): Promise<string[]> {
  const feeds = [
    "https://feeds.bbci.co.uk/zhongwen/simp/rss.xml",
    "http://feeds.feedburner.com/ruanyifeng",
  ];
  for (const feed of feeds) {
    try {
      const bridge = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed)}`;
      const j = await safeJson<any>(bridge, { timeoutMs: 9000 });
      const items = Array.isArray(j?.items) ? j.items : [];
      const list = items
        .map((x: any) => String(x?.title || "").trim())
        .filter(Boolean)
        .slice(0, 10);
      if (list.length) return list;
    } catch {
      /* 换下一条源 */
    }
  }
  return [];
}

/**
 * 今日快讯 + 微博热搜
 *   主源 60s API → 备源 RSS → 上次成功缓存 → 编辑精选
 *   缓存写入 localStorage，接口限流时仍能展示真实新闻，不再退回开发技巧
 */
export function useFlashNews() {
  const [flash, setFlash] = useState<string[]>([]);
  const [hot, setHot] = useState<HotItem[]>([]);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);

  const load = useCallback(async (force = false) => {
    const cached = readCache();
    if (!force && cached) {
      setFlash(cached.flash);
      setHot(cached.hot);
      setDate(cached.date);
      if (Date.now() - cached.at < TTL) return;
    }

    setLoading(true);
    setErr(false);
    try {
      const data = await fetchFrom60s();
      setFlash(data.flash);
      setHot(data.hot);
      setDate(data.date);
      writeCache({ at: Date.now(), ...data });
    } catch {
      // 60s 限流/失败：先用缓存顶着，没有缓存再尝试 RSS
      if (!cached) {
        const rss = await fetchFromRss();
        if (rss.length) {
          setFlash(rss);
          setDate("");
          writeCache({ at: Date.now(), date: "", flash: rss, hot: [] });
        } else {
          setErr(true);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { flash, hot, date, loading, err, load };
}
