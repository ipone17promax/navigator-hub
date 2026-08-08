/**
 * 内部运行时日志单例
 *
 * 设计要点：
 * - 框架无关，可在任意位置（组件 / 工具函数 / 模块顶层）调用
 * - ring buffer 保留最近 200 条，超出丢弃最旧
 * - 防抖 500ms 批量写入 localStorage，避免高频写
 * - beforeunload 强制同步 flush 一次，防止崩溃前丢日志
 * - 日志收集始终开启（即使未解锁也采集）；console 镜像仅解锁后开启
 * - subscribe 发布订阅，单订阅者抛错不影响其他人
 *
 * 使用规范：
 * - 禁止在 for / while / 高频事件（如 mousemove）内调用 logger
 * - data 字段禁止包含 PII（密码、token、精确定位坐标）
 */

import { LS_KEYS } from "@/config/themes";

// ============================================================
// 类型定义
// ============================================================
export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  id: string;
  ts: number;
  level: LogLevel;
  tag: string;
  message: string;
  data?: unknown;
}

export type LogSubscriber = (entries: LogEntry[]) => void;

// ============================================================
// 内部状态
// ============================================================
const MAX = 200;
const FLUSH_DEBOUNCE_MS = 500;
const LS_KEY = LS_KEYS.logs;

const buffer: LogEntry[] = [];
const subscribers = new Set<LogSubscriber>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let consoleMirrorEnabled = false;

// ============================================================
// 安全的 localStorage 工具（与 useAppStore 同款，SSR / 隐私模式兜底）
// ============================================================
function safeRead<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 配额满 / 隐私模式 → 静默 */
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

// ============================================================
// 模块加载时恢复历史日志
// ============================================================
void (() => {
  const history = safeRead<LogEntry[]>(LS_KEY, []);
  if (Array.isArray(history) && history.length > 0) {
    buffer.push(...history.slice(-MAX));
  }
})();

// ============================================================
// 核心：push / flush / notify
// ============================================================
function genId(ts: number): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* fallthrough */
  }
  return `${ts}-${Math.random().toString(36).slice(2, 10)}`;
}

function push(level: LogLevel, tag: string, message: string, data?: unknown): void {
  const ts = Date.now();
  const entry: LogEntry = { id: genId(ts), ts, level, tag, message, data };
  buffer.push(entry);
  // 保留最新 MAX 条
  if (buffer.length > MAX) {
    buffer.splice(0, buffer.length - MAX);
  }
  scheduleFlush();
  notify();

  // 解锁后才镜像到 console，防普通用户 F12 看到
  if (consoleMirrorEnabled && typeof console !== "undefined") {
    const prefix = `[${tag}] ${message}`;
    if (level === "error") {
      console.error(prefix, data ?? "");
    } else if (level === "warn") {
      console.warn(prefix, data ?? "");
    } else {
      console.log(prefix, data ?? "");
    }
  }
}

function scheduleFlush(): void {
  if (flushTimer !== null) return; // 已调度则合并（防抖）
  flushTimer = setTimeout(() => {
    flushTimer = null;
    safeWrite(LS_KEY, buffer);
  }, FLUSH_DEBOUNCE_MS);
}

/** 同步强制 flush（beforeunload 用） */
function flushNow(): void {
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  safeWrite(LS_KEY, buffer);
}

function notify(): void {
  const snapshot = buffer.slice();
  subscribers.forEach((cb) => {
    try {
      cb(snapshot);
    } catch {
      /* 单订阅者异常不影响其他 */
    }
  });
}

// ============================================================
// beforeunload 强制 flush
// ============================================================
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", flushNow);
  // 可见性变化时也 flush（移动端切换 tab 不一定触发 beforeunload）
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushNow();
  });
}

// ============================================================
// 对外 API
// ============================================================
export const logger = {
  info(tag: string, message: string, data?: unknown): void {
    push("info", tag, message, data);
  },
  warn(tag: string, message: string, data?: unknown): void {
    push("warn", tag, message, data);
  },
  error(tag: string, message: string, data?: unknown): void {
    push("error", tag, message, data);
  },
  getLogs(): LogEntry[] {
    return buffer.slice();
  },
  clear(): void {
    buffer.length = 0;
    if (flushTimer !== null) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    safeRemove(LS_KEY);
    notify();
  },
  subscribe(cb: LogSubscriber): () => void {
    subscribers.add(cb);
    return () => subscribers.delete(cb);
  },
};

/**
 * 内部钩子：控制 console 镜像开关
 * 仅供 useAuthStore 在身份状态变化时调用
 */
export function __setConsoleMirror(enabled: boolean): void {
  consoleMirrorEnabled = enabled;
}
