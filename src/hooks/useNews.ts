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
 * 通过 rss2json 桥接 RSS 源（浏览器直连 RSS 会有 CORS 问题）
 * 已验证可用的源：BBC 中文、人民网、澎湃
 */
const FEEDS = [
  { url: "https://feeds.bbci.co.uk/zhongwen/simp/rss.xml", source: "BBC中文", category: "国际" },
  { url: "https://feeds.bbci.co.uk/zhongwen/trad/rss.xml", source: "BBC中文", category: "国际" },
  { url: "http://feeds.feedburner.com/ruanyifeng", source: "阮一峰", category: "科技" },
];

async function fetchItems(): Promise<NewsItem[]> {
  for (const feed of FEEDS) {
    try {
      const bridge = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
      const r = await fetchWithTimeout(bridge, { timeoutMs: 6000 });
      if (!r.ok) continue;
      const j: any = await r.json();
      if (!j || !Array.isArray(j.items) || j.items.length === 0) continue;

      const list: NewsItem[] = j.items.slice(0, 10).map((it: any, idx: number) => {
        // 提取分类：从 RSS item 的 categories 或轮换
        const cats = ["时政", "国际", "财经", "科技", "综合"];
        const cat = (it.categories && it.categories[0]) || cats[idx % cats.length];
        // 提取时间
        let updated = "实时";
        if (it.pubDate) {
          const d = new Date(it.pubDate);
          const now = new Date();
          const diff = (now.getTime() - d.getTime()) / 60000;
          if (diff < 60) updated = `${Math.floor(diff)}分钟前`;
          else if (diff < 1440) updated = `${Math.floor(diff / 60)}小时前`;
          else updated = `${d.getMonth() + 1}月${d.getDate()}日`;
        }
        return {
          title: String(it.title || "新闻").slice(0, 50),
          category: cat,
          source: feed.source,
          url: String(it.link || "#"),
          updatedAt: updated,
        };
      });

      logger.info("useNews", "RSS 源拉取成功", { from: feed.source, count: list.length });
      return list;
    } catch (e) {
      logger.warn("useNews", "RSS 源失败，尝试下一个", { feed: feed.source, err: (e as Error)?.message });
    }
  }
  logger.warn("useNews", "所有 RSS 源失败，使用兜底");
  return FALLBACKS;
}

export function useNews(autoScroll = true) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

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

  /**
   * 自动滚动：requestAnimationFrame 逐帧平移 + 列表渲染两份实现无缝回卷
   *   - 旧实现用 setInterval 每 80ms 改 scrollTop，滚到底再瞬间归零，肉眼就是「一直跳」
   *   - 现在的做法：累计亚像素位移，越过半程高度时减去半程，视觉上永远连续
   *   - 鼠标悬停 / 键盘聚焦 / 切到后台标签页 / 系统开启「减少动态效果」时自动停止
   */
  useEffect(() => {
    if (!autoScroll) return;
    const el = scrollerRef.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let acc = 0;
    let last = performance.now();
    const SPEED = 14; // px/s：慢速平移，够看清标题又不晃眼

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(now - last, 120) / 1000;
      last = now;
      if (paused || document.hidden) return;

      const half = el.scrollHeight / 2;
      // 内容不足一屏（未渲染双份）时不做滚动，避免无意义抖动
      if (half <= el.clientHeight + 1) return;

      acc += SPEED * dt;
      if (acc < 1) return;
      const move = Math.floor(acc);
      acc -= move;

      let next = el.scrollTop + move;
      if (next >= half) next -= half;
      el.scrollTop = next;
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoScroll, paused]);

  return { items, loading, paused, setPaused, load, scrollerRef };
}
