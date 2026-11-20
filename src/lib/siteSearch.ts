import { SITES, CATEGORY_MAP } from "@/config/sites";
import { useUserStore } from "@/stores/useUserStore";
import type { SiteCategory } from "@/shared/types";

/**
 * 本地站点搜索索引
 * - 支持中文名、英文名、拼音全拼/首字母、简介、分类匹配
 * - 用 useUserStore 的访问统计做频率与最近访问加权
 * - 纯前端、无外部请求
 */

export interface SiteHit {
  id: string;
  name: string;
  url: string;
  description: string;
  category: SiteCategory;
  iconName: string;
  accent: string;
  score: number;
}

/** 中文站点名的拼音别名（全拼 + 首字母），用于「输入 zh 匹配知乎」 */
const PINYIN: Record<string, string> = {
  百度: "baidu bd",
  知乎: "zhihu zh",
  微博: "weibo wb",
  豆瓣: "douban db",
  哔哩哔哩: "bilibili blbl bzhan",
  爱奇艺: "aiqiyi aqy",
  腾讯视频: "tengxunshipin txsp",
  优酷: "youku yk",
  "B 站学习区": "bzhanxuexi bzxx bz",
  慕课网: "mokewang mk",
  极客时间: "jikeshijian jksj",
  掘金: "juejin jj",
  可汗学院: "kehanxueyuan khxy",
  飞书: "feishu fs",
  钉钉: "dingding dd",
  石墨文档: "shimowendang smwd",
  腾讯文档: "tengxunwendang txwd",
  语雀: "yunque yq",
  通义万相: "tongyiwanxiang tywx",
  通义千问: "tongyiqianwen tyqw",
  文心一言: "wenxinyiyan wxyy",
  全球风暴实时预告: "quanqiufengbao qqfb",
  二进制解析器: "erjinzhijiexi ejz",
  摩斯电码机: "mosidianma msdm",
  罗盘时钟: "luopanzhongshi lpzs",
};

function baseSites(): SiteHit[] {
  return SITES.map((s) => ({
    id: s.id,
    name: s.name,
    url: s.url,
    description: s.description,
    category: s.category,
    iconName: s.iconName,
    accent: s.accent,
    score: 0,
  }));
}

function customSites(): SiteHit[] {
  return useUserStore.getState().customSites.map((c) => ({
    id: c.id,
    name: c.name,
    url: c.url,
    description: c.desc || "",
    category: c.categoryId as SiteCategory,
    iconName: c.icon || "Globe",
    accent: "#6366f1",
    score: 0,
  }));
}

export function categoryLabel(c: SiteCategory): string {
  return CATEGORY_MAP[c]?.label || c;
}

interface VisitStat {
  count: number;
  lastAt: number;
}

function visitMap(): Record<string, VisitStat> {
  const map: Record<string, VisitStat> = {};
  for (const v of useUserStore.getState().visits) {
    map[v.siteId] = { count: v.count, lastAt: v.lastAt };
  }
  return map;
}

const WEEK = 7 * 24 * 60 * 60 * 1000;

export function searchSites(query: string, limit = 8): SiteHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const stats = visitMap();
  const now = Date.now();
  const hits: SiteHit[] = [];

  for (const site of [...baseSites(), ...customSites()]) {
    const name = site.name.toLowerCase();
    const desc = site.description.toLowerCase();
    const py = (PINYIN[site.name] || "").toLowerCase();
    const aliases = py ? py.split(/[\s,]+/).filter(Boolean) : [];

    let base = 0;
    if (name === q) base = 120;
    else if (name.startsWith(q)) base = 90;
    else if (name.includes(q)) base = 70;
    else if (aliases.some((a) => a === q)) base = 80;
    else if (aliases.some((a) => a.startsWith(q))) base = 55;
    else if (desc.includes(q)) base = 30;
    else if (site.category.toLowerCase().includes(q) || categoryLabel(site.category).includes(q)) base = 15;
    if (base === 0) continue;

    const stat = stats[site.id];
    const freq = stat ? Math.min(18, stat.count * 1.5) : 0;
    const recency = stat ? Math.max(0, 1 - (now - stat.lastAt) / WEEK) * 12 : 0;
    site.score = base + freq + recency;
    hits.push(site);
  }

  return hits.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).slice(0, limit);
}

/** 站内工具（url 以 / 开头）用 hash 路由跳转，外部站点新开标签 */
export function openSiteTarget(url: string) {
  if (url.startsWith("/")) {
    window.location.hash = "#" + url;
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}