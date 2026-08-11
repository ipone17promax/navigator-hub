import { logger } from "./logger";

export interface FetchOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * 统一 fetch 封装：超时控制 + CORS 失败降级提示 + 错误日志
 */
export async function fetchWithTimeout(input: string | URL, init: FetchOptions = {}): Promise<Response> {
  const { timeoutMs = 8000, ...rest } = init;
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(input, { ...rest, signal: ctrl.signal });
  } catch (e) {
    if ((e as Error).name === "AbortError") {
      logger.warn("fetchWithTimeout", "请求超时", { url: String(input), timeoutMs });
    } else {
      logger.warn("fetchWithTimeout", "请求失败（通常是 CORS 或离线）", {
        url: String(input),
        reason: (e as Error).message || String(e),
      });
    }
    throw e;
  } finally {
    clearTimeout(tid);
  }
}

/** 安全拿到 JSON：异常时返回 null 并记录日志，不往外抛 */
export async function safeJson<T = unknown>(input: string | URL, init: FetchOptions = {}): Promise<T | null> {
  try {
    const r = await fetchWithTimeout(input, init);
    if (!r.ok) {
      logger.warn("safeJson", "非 2xx 状态", { url: String(input), status: r.status });
      return null;
    }
    return (await r.json()) as T;
  } catch {
    return null;
  }
}
