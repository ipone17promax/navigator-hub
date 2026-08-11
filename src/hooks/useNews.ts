import { useCallback, useEffect, useRef, useState } from "react";
import { logger } from "@/lib/logger";
import { fetchWithTimeout } from "@/lib/api";

export interface NewsItem {
  title: string;
  category: string;
  source: string;
  url: string;
  updatedAt: string;
}

const FALLBACKS: NewsItem[] = [
  { title: "新华网 · 时政新闻头条速递", category: "时政", source: "新华网", url: "http://www.xinhuanet.com/politics/", updatedAt: "实时" },
  { title: "人民网 · 国际新闻动态",       category: "国际", source: "人民网", url: "http://world.people.com.cn/",        updatedAt: "实时" },
  { title: "央视网 · 新闻联播在线",       category: "时政", source: "央视网", url: "https://tv.cctv.com/lm/xwlb/",       updatedAt: "实时" },
  { title: "中国新闻网 · 财经资讯",       category: "财经", source: "中新网", url: "https://www.chinanews.com.cn/finance/",updatedAt: "实时" },
  { title: "澎湃新闻 · 最新深度报道",     category: "综合", source: "澎湃",   url: "https://www.thepaper.cn/",             updatedAt: "实时" },
  { title: "环球网 · 国际视野",           category: "国际", source: "环球网", url: "https://world.huanqiu.com/",          updatedAt: "实时" },
  { title: "BBC中文 · 国际新闻",          category: "国际", source: "BBC中文",url: "https://www.bbc.com/zhongwen/simp",    updatedAt: "实时" },
  { title: "路透中文网 · 全球财经",       category: "财经", source: "路透",   url: "https://cn.reuters.com/",              updatedAt: "实时" },
];

/**
 * 尝试从 RSS2JSON/第三方桥接拉 BBC / 新华网 RSS，失败 -> 静态兜底
 */
async function fetchItems(): Promise<NewsItem[]> {
  const feeds = [
    "https://feeds.bbci.co.uk/zhongwen/simp/rss.xml",
    "http://www.xinhuanet.com/world/news_world.xml",
  ];
  for (const f of feeds) {
    try {
      const j: any = await fetchWithTimeout(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(f)}`, { timeoutMs: 5000 }).then((r) => r.ok ? r.json() : null);
      if (!j || !Array.isArray(j.items) || j.items.length === 0) continue;
      const list: NewsItem[] = j.items.slice(0, 8).map((it: any, idx: number) => ({
        title: String(it.title || "新闻").slice(0, 40),
        category: ["时政", "国际", "财经", "综合"][idx % 4],
        source: j.feed?.title?.slice(0, 10) || "RSS",
        url: String(it.link || "#"),
        updatedAt: "实时",
      }));
      logger.info("useNews", "RSS 源拉取成功", { from: f, count: list.length });
      return list;
    } catch {
      // 继续下一个源
    }
  }
  return FALLBACKS;
}

export function useNews(autoScroll = true) {
  const [items, setItems] = useState<NewsItem[]>(FALLBACKS);
  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchItems();
      setItems(list);
    } catch (e) {
      logger.error("useNews", "新闻加载失败，使用兜底", { reason: (e as Error)?.message });
      setItems(FALLBACKS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // 自动滚动
  useEffect(() => {
    if (!autoScroll) return;
    const el = scrollerRef.current;
    if (!el) return;
    const step = () => {
      if (paused) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
        el.scrollTop = 0;
      } else {
        el.scrollTop += 1;
      }
    };
    timerRef.current = window.setInterval(step, 60);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [autoScroll, paused, items]);

  return { items, loading, paused, setPaused, load, scrollerRef };
}
