import { useState, useEffect, useRef, useCallback } from "react";
import * as Icons from "lucide-react";

interface NewsItem {
  title: string;
  source: string;
  time: string;
  category: string;
  url: string;
}

/** 本地兜底数据（真实新闻网站栏目链接，API 失败时使用） */
const FALLBACK_NEWS: NewsItem[] = [
  { title: "新华网 · 时政新闻头条速递", source: "新华网", time: "实时", category: "时政", url: "https://www.xinhuanet.com/politics/" },
  { title: "人民网 · 国际新闻动态", source: "人民网", time: "实时", category: "国际", url: "http://world.people.com.cn/" },
  { title: "央视网 · 新闻联播在线", source: "央视网", time: "实时", category: "时政", url: "https://news.cctv.com/" },
  { title: "中国新闻网 · 财经资讯", source: "中新网", time: "实时", category: "财经", url: "https://www.chinanews.com.cn/finance/" },
  { title: "澎湃新闻 · 最新深度报道", source: "澎湃", time: "实时", category: "综合", url: "https://www.thepaper.cn/" },
  { title: "环球网 · 国际视野", source: "环球网", time: "实时", category: "国际", url: "https://www.huanqiu.com/" },
  { title: "BBC中文 · 国际新闻", source: "BBC中文", time: "实时", category: "国际", url: "https://www.bbc.com/zhongwen/simp" },
  { title: "路透中文网 · 全球财经", source: "路透", time: "实时", category: "财经", url: "https://cn.reuters.com/" },
];

const CAT_COLORS: Record<string, string> = {
  时政: "text-red-400 border-red-400/30",
  财经: "text-green-400 border-green-400/30",
  国际: "text-blue-400 border-blue-400/30",
  科技: "text-cyan-400 border-cyan-400/30",
  综合: "text-purple-400 border-purple-400/30",
};

/** pubDate → 相对时间 */
function relTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "实时";
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m}分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}小时前`;
  return `${Math.floor(h / 24)}天前`;
}

/** 拉 BBC 中文 RSS（经 rss2json 代理，支持 CORS，免 key） */
async function fetchNews(): Promise<NewsItem[]> {
  const r = await fetch(
    "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ffeeds.bbci.co.uk%2Fzhongwen%2Fsimp%2Frss.xml&count=12",
  );
  if (!r.ok) throw new Error("news api failed");
  const j = await r.json();
  if (j.status !== "ok" || !Array.isArray(j.items)) throw new Error("bad news data");
  return j.items.slice(0, 10).map((it: { title: string; link: string; pubDate?: string }) => ({
    title: it.title,
    source: "BBC中文",
    time: it.pubDate ? relTime(it.pubDate) : "实时",
    category: "国际",
    url: it.link,
  }));
}

export default function NewsStream() {
  const [items, setItems] = useState<NewsItem[]>(FALLBACK_NEWS);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const news = await fetchNews();
      if (news.length) setItems(news);
    } catch {
      /* 保留兜底数据 */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 300000); // 5 分钟刷新一次
    return () => clearInterval(timer);
  }, [load]);

  // 自动滚动（鼠标悬停时暂停，让用户手动拖动）
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTop += 1;
      if (el.scrollTop >= el.scrollHeight / 2) el.scrollTop = 0;
    }, 50);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <div
      className="rounded-2xl border border-stroke bg-bg-elevate/60 p-4 backdrop-blur-xl transition-all duration-300 hover:border-stroke-hover"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icons.Radio size={16} className={`text-red-400 ${loading ? "animate-pulse" : "animate-pulse"}`} />
          <span className="text-sm font-semibold text-ink">资讯速递</span>
        </div>
        <div className="flex items-center gap-2">
          <Icons.RefreshCw
            size={12}
            className={`cursor-pointer text-ink-subtle transition-colors hover:text-ink ${loading ? "animate-spin" : ""}`}
            onClick={load}
          />
          <span className="text-[11px] text-ink-subtle">{paused ? "已暂停·可拖动" : "滚动中"}</span>
        </div>
      </div>

      <div ref={scrollRef} className="h-[240px] overflow-y-auto pr-1">
        <div className="space-y-2">
          {[...items, ...items].map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-full items-start gap-2 rounded-lg p-2 text-left transition-colors hover:bg-white/5"
            >
              <span
                className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                  CAT_COLORS[item.category] ?? "text-ink-muted border-stroke"
                }`}
              >
                {item.category}
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm text-ink-muted transition-colors group-hover:text-ink">
                  {item.title}
                </p>
                <p className="mt-0.5 text-[11px] text-ink-subtle">
                  {item.source} · {item.time}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
