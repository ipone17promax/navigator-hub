import { useCallback, useEffect, useState } from "react";
import { safeJson } from "@/lib/api";
import { logger } from "@/lib/logger";

const CACHE_KEY = "nh.daily.v1";

export interface DailyBrief {
  date: string;
  news: string[];
}

interface DailyCache {
  at: number;
  data: DailyBrief;
}

function readCache(): DailyBrief | null {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null") as DailyCache | null;
    // 过期也先返回，失败时至少还能展示上次简报
    if (c && Array.isArray(c.data?.news) && c.data.news.length > 0) {
      return c.data;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export type DailyStatus = "loading" | "ok" | "error";

/**
 * 每日 60 秒简报（60s API，CORS 全开放）
 * 作为热榜不可达时的内容兜底，保证国内网络下卡片仍有真实内容
 */
export function useDaily() {
  const [data, setData] = useState<DailyBrief | null>(readCache);
  const [status, setStatus] = useState<DailyStatus>(data ? "ok" : "loading");

  const load = useCallback(
    async (force = false) => {
      if (!force && data) {
        setStatus("ok");
        return;
      }
      setStatus("loading");
      const j = await safeJson<{ code?: number; data?: { date?: string; news?: string[] } }>(
        "https://60s.viki.moe/v2/60s",
        { timeoutMs: 6000 },
      );
      if (j?.code === 200 && j.data && Array.isArray(j.data.news) && j.data.news.length > 0) {
        const next: DailyBrief = { date: j.data.date || "", news: j.data.news.slice(0, 12) };
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data: next } satisfies DailyCache));
        } catch {
          /* ignore */
        }
        setData(next);
        setStatus("ok");
      } else if (!data) {
        setStatus("error");
        logger.warn("useDaily", "60s 简报不可用");
      }
      // 有旧数据时保持 ok，避免内容卡片突然消失
    },
    [data],
  );

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, status, reload: () => load(true) };
}