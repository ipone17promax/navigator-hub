import { useCallback, useEffect, useState } from "react";
import { safeJson } from "@/lib/api";
import { logger } from "@/lib/logger";

const CACHE_KEY = "nh.hot.v1";

export interface HotItem {
  title: string;
  url: string;
  source: string;
  sourceName: string;
}

interface HotSourceDef {
  key: string;
  name: string;
  /** vvhan 备用源的类型参数（没有则只用 imsyy） */
  alt?: string;
}

const SOURCES: HotSourceDef[] = [
  { key: "weibo", name: "微博热搜", alt: "hotlist/wbHot" },
  { key: "zhihu", name: "知乎热榜", alt: "hotlist/zhihuHot" },
  { key: "github", name: "GitHub Trending" },
];

/** 主源：DailyHotApi 公共实例（imsyy），CORS 开放 */
const IMSYY = "https://api-hot.imsyy.top";
/** 备用源：vvhan 聚合接口，字段格式不同，宽松解析 */
const VVHAN = "https://api.vvhan.com";

async function fetchImsyy(key: string, name: string): Promise<HotItem[]> {
  const j = await safeJson<{ code?: number; data?: { title?: string; url?: string }[] }>(
    `${IMSYY}/${key}`,
    { timeoutMs: 2500 },
  );
  if (!j || j.code !== 200 || !Array.isArray(j.data)) throw new Error(`${key} imsyy unavailable`);
  return j.data
    .filter((d) => typeof d.title === "string" && typeof d.url === "string")
    .slice(0, 6)
    .map((d) => ({
      title: d.title as string,
      url: d.url as string,
      source: key,
      sourceName: name,
    }));
}

async function fetchVvhan(api: string, key: string, name: string): Promise<HotItem[]> {
  const j = await safeJson<{ success?: boolean; data?: Record<string, unknown>[] }>(
    `${VVHAN}/${api}`,
    { timeoutMs: 2500 },
  );
  if (!j || !Array.isArray(j.data)) throw new Error(`${key} vvhan unavailable`);
  const items: HotItem[] = [];
  for (const d of j.data) {
    const title = typeof d.title === "string" ? d.title : "";
    const url = typeof d.url === "string" ? d.url : typeof d.murl === "string" ? (d.murl as string) : "";
    if (title && url) items.push({ title, url, source: key, sourceName: name });
  }
  if (items.length === 0) throw new Error(`${key} vvhan empty`);
  return items.slice(0, 6);
}

async function fetchSource(def: HotSourceDef): Promise<HotItem[]> {
  try {
    return await fetchImsyy(def.key, def.name);
  } catch {
    if (!def.alt) throw new Error(`${def.key} unavailable`);
    return await fetchVvhan(def.alt, def.key, def.name);
  }
}

interface HotCache {
  at: number;
  items: HotItem[];
}

function readCache(): HotItem[] {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null") as HotCache | null;
    // 过期也先返回，失败时至少还能展示上次内容
    if (c && Array.isArray(c.items) && c.items.length > 0) {
      return c.items;
    }
  } catch {
    /* ignore */
  }
  return [];
}

function writeCache(items: HotItem[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), items } satisfies HotCache));
  } catch {
    /* ignore */
  }
}

export type HotStatus = "loading" | "ok" | "error";

export function useHot() {
  const [items, setItems] = useState<HotItem[]>(readCache);
  const [status, setStatus] = useState<HotStatus>(items.length ? "ok" : "loading");

  const load = useCallback(
    async (force = false) => {
      if (!force && items.length > 0) {
        setStatus("ok");
        return;
      }
      setStatus("loading");
      const results = await Promise.allSettled(SOURCES.map((s) => fetchSource(s)));
      const ok = results
        .filter((r): r is PromiseFulfilledResult<HotItem[]> => r.status === "fulfilled")
        .map((r) => r.value);
      const bySource = SOURCES.map((s) => ok.find((arr) => arr[0]?.source === s.key) || []);
      const merged: HotItem[] = [];
      for (let i = 0; i < 5; i++) {
        for (const arr of bySource) {
          if (arr[i]) merged.push(arr[i]);
        }
      }
      if (merged.length >= 5) {
        writeCache(merged);
        setItems(merged);
        setStatus("ok");
      } else if (items.length === 0) {
        setStatus("error");
        logger.warn("useHot", "热榜源全部不可用，已静默降级");
      }
      // 有旧数据时保持 ok，避免内容卡片突然消失
    },
    [items.length],
  );

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { items, status, reload: () => load(true) };
}