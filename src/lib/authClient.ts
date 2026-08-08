/**
 * 纯前端身份认证模块
 *
 * 安全模型说明：
 * 本模块为"门闩"级别方案（非"保险柜"），适用于无后端的纯静态部署。
 * - 访问码 password-01 至 password-99 在本地校验
 * - 登录成功后签发 HMAC-SHA256 签名 token，存入 sessionStorage
 * - token 生命周期 = 标签页生命周期：关闭网页自动失效，需重新认证
 * - 刷新页面 / 切到后台均保持登录（同一标签页内有效）
 * - 失败 3 次锁定 5 分钟，锁定状态存 sessionStorage
 * - 所有关键节点写入 logger，管理员可在调试面板查看访问记录
 *
 * 已知边界（纯前端方案的固有局限）：
 * - 密钥硬编码在源码中，懂代码的用户可逆向绕过
 * - sessionStorage 可被手动清空绕过锁定
 * - 真正的安全需服务器端方案（已移除的 Edge Functions 版本）
 *
 * 接口与原 Edge Functions 版本完全兼容：
 * login / verify / logout 三个函数签名和返回类型保持不变。
 */

import { logger } from "@/lib/logger";
import { reportAuthEvent } from "@/lib/logReporter";

// ============================================================
// 常量
// ============================================================
const MAX_FAIL = 3;
const LOCK_MS = 5 * 60 * 1000; // 5 分钟

// 签名密钥：硬编码随机串（防小白，非真正安全密钥）
// 若需更换：node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
const SIGN_SECRET = "navhub-static-secret-9f3a7c1e5b2d8a4f6e0c3b1d7a9e5f2c8b4a6d0e2f1c3b5a7d9e1f3c5b7a9d2e4f";

// localStorage 键名
const TOKEN_KEY = "navhub:authToken";
const FAIL_KEY = "navhub:authFail";

// 访问码校验正则：password-01 到 password-99（不区分大小写，自动归一化为小写）
const ACCESS_CODE_RE = /^password-(\d{2})$/i;

/** 判断是否为特级管理员（password-01） */
export function isSuperAdmin(userId: string): boolean {
  return /^password-01$/i.test(userId);
}

// ============================================================
// 浏览器指纹（用于日志识别是否为同一人，不含精确追踪）
// ============================================================
function browserFingerprint(): string {
  try {
    const ua = navigator.userAgent;
    // 操作系统
    const os = /Windows NT 10/.test(ua) ? "Win10"
      : /Windows/.test(ua) ? "Win"
      : /Mac OS X/.test(ua) ? "Mac"
      : /Android/.test(ua) ? "Android"
      : /iPhone|iPad/.test(ua) ? "iOS"
      : /Linux/.test(ua) ? "Linux"
      : "Unknown";
    // 浏览器
    const browser = /Edg\//.test(ua) ? "Edge"
      : /Chrome\//.test(ua) ? "Chrome"
      : /Firefox\//.test(ua) ? "Firefox"
      : /Safari\//.test(ua) ? "Safari"
      : "Unknown";
    // 屏幕分辨率（辅助区分设备）
    const screen = `${window.screen.width}x${window.screen.height}`;
    return `${os}/${browser}/${screen}`;
  } catch {
    return "unknown";
  }
}

/** 脱敏：只保留访问码编号，不记录完整访问码 */
function maskCode(userId: string): string {
  const m = userId.match(ACCESS_CODE_RE);
  return m ? `**-${m[1]}` : "****";
}

// ============================================================
// 类型
// ============================================================
export type LoginResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "invalid" | "locked" | "network" | "bad_request"; lockedUntil?: number };

export type VerifyResult =
  | { authed: true; userId: string }
  | { authed: false };

interface AuthToken {
  uid: string;
}

interface FailRecord {
  count: number;
  lockUntil: number;
}

// ============================================================
// 类型守卫（项目 tsconfig 为 strict:false，需显式守卫保证收窄）
// ============================================================
export function isLoginSuccess(r: LoginResult): r is { ok: true; userId: string } {
  return r.ok === true;
}

export function isAuthed(r: VerifyResult): r is { authed: true; userId: string } {
  return r.authed === true;
}

// ============================================================
// 安全的 sessionStorage 工具（隐私模式兜底）
// ============================================================
function safeGet<T>(key: string, fallback: T): T {
  try {
    const v = sessionStorage.getItem(key);
    return v !== null ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

function safeRemove(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

// ============================================================
// HMAC-SHA256（Web Crypto API，零依赖，需 HTTPS 或 localhost）
// ============================================================
async function hmacSign(data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SIGN_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function hmacVerify(data: string, sig: string): Promise<boolean> {
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(SIGN_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const bin = atob(sig);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return crypto.subtle.verify("HMAC", key, bytes, enc.encode(data));
  } catch {
    return false;
  }
}

// ============================================================
// 失败锁定逻辑
// ============================================================
function getFail(): FailRecord {
  return safeGet<FailRecord>(FAIL_KEY, { count: 0, lockUntil: 0 });
}

function isLocked(): { locked: boolean; remainingMs: number } {
  const fail = getFail();
  const remainingMs = (fail.lockUntil ?? 0) - Date.now();
  return { locked: remainingMs > 0, remainingMs: Math.max(0, remainingMs) };
}

function recordFail(): { locked: boolean; lockUntil: number } {
  const fail = getFail();
  const nextCount = (fail.count ?? 0) + 1;
  const willLock = nextCount >= MAX_FAIL;
  const next: FailRecord = {
    count: willLock ? 0 : nextCount,
    lockUntil: willLock ? Date.now() + LOCK_MS : 0,
  };
  safeSet(FAIL_KEY, next);
  return { locked: willLock, lockUntil: next.lockUntil };
}

// ============================================================
// 对外 API（接口与原 Edge Functions 版本完全兼容）
// ============================================================

/** 提交用户标识登录 */
export async function login(userId: string): Promise<LoginResult> {
  const fp = browserFingerprint();

  // 参数校验
  if (typeof userId !== "string" || !userId) {
    logger.warn("Auth", "登录失败：参数为空", { fp });
    return { ok: false, reason: "bad_request" };
  }

  // 自动归一化为小写，防止大小写问题
  const normalized = userId.toLowerCase();

  logger.info("Auth", "登录尝试", { code: maskCode(normalized), fp });

  // 锁定检查
  const lock = isLocked();
  if (lock.locked) {
    logger.warn("Auth", "登录被拒：已锁定", { code: maskCode(normalized), remainingSec: Math.ceil(lock.remainingMs / 1000) });
    reportAuthEvent("warn", "锁定中尝试登录", `${maskCode(normalized)} · 剩余${Math.ceil(lock.remainingMs / 1000)}s · ${fp}`);
    return { ok: false, reason: "locked", lockedUntil: Date.now() + lock.remainingMs };
  }

  // 访问码校验：格式 + 数值范围双重
  const match = normalized.match(ACCESS_CODE_RE);
  if (!match) {
    const r = recordFail();
    const attemptCount = r.locked ? MAX_FAIL : getFail().count;
    logger.warn("Auth", "登录失败：格式不正确", { code: maskCode(normalized), attempt: attemptCount, fp });
    reportAuthEvent("warn", "登录失败：格式不正确", `${maskCode(normalized)} · 第${attemptCount}次 · ${fp}`);
    if (r.locked) {
      logger.error("Auth", "触发锁定：连续失败达上限", { code: maskCode(normalized), lockMin: LOCK_MS / 60000 });
      reportAuthEvent("error", "触发锁定", `${maskCode(normalized)} · 连续失败${MAX_FAIL}次 · 锁定${LOCK_MS / 60000}分钟 · ${fp}`);
      return { ok: false, reason: "locked", lockedUntil: r.lockUntil };
    }
    return { ok: false, reason: "invalid" };
  }
  const num = parseInt(match[1], 10);
  if (num < 1 || num > 99) {
    const r = recordFail();
    const attemptCount = r.locked ? MAX_FAIL : getFail().count;
    logger.warn("Auth", "登录失败：编号超出范围", { code: maskCode(normalized), num, attempt: attemptCount, fp });
    reportAuthEvent("warn", "登录失败：编号超范围", `${maskCode(normalized)} · num=${num} · 第${attemptCount}次 · ${fp}`);
    if (r.locked) {
      logger.error("Auth", "触发锁定：连续失败达上限", { code: maskCode(normalized), lockMin: LOCK_MS / 60000 });
      reportAuthEvent("error", "触发锁定", `${maskCode(normalized)} · 连续失败${MAX_FAIL}次 · 锁定${LOCK_MS / 60000}分钟 · ${fp}`);
      return { ok: false, reason: "locked", lockedUntil: r.lockUntil };
    }
    return { ok: false, reason: "invalid" };
  }

  // 成功：清失败计数 + 签发 token（存储归一化后的小写）
  safeRemove(FAIL_KEY);
  const token: AuthToken = { uid: normalized };
  const payloadStr = JSON.stringify(token);
  const sig = await hmacSign(payloadStr);
  safeSet(TOKEN_KEY, { payload: payloadStr, sig });

  logger.info("Auth", "登录成功", { code: maskCode(normalized), fp });
  reportAuthEvent("info", "✅ 登录成功", `${maskCode(normalized)} · ${fp}`);
  return { ok: true, userId: normalized };
}

/** 验证当前 token 是否有效 */
export async function verify(): Promise<VerifyResult> {
  const fp = browserFingerprint();
  const stored = safeGet<{ payload: string; sig: string } | null>(TOKEN_KEY, null);
  if (!stored || !stored.payload || !stored.sig) {
    logger.info("Auth", "会话验证：无 token（访客）", { fp });
    return { authed: false };
  }

  // 验签
  const valid = await hmacVerify(stored.payload, stored.sig);
  if (!valid) {
    logger.error("Auth", "会话验证：签名无效（疑似篡改）", { fp });
    reportAuthEvent("error", "🚨 签名无效（疑似篡改）", fp);
    safeRemove(TOKEN_KEY);
    return { authed: false };
  }

  // 解析 token（sessionStorage 关闭网页即清除，无需过期检查）
  try {
    const token = JSON.parse(stored.payload) as AuthToken;
    logger.info("Auth", "会话验证通过：恢复管理员", { code: maskCode(token.uid), fp });
    reportAuthEvent("info", "🔄 会话恢复", `${maskCode(token.uid)} · ${fp}`);
    return { authed: true, userId: token.uid };
  } catch {
    logger.error("Auth", "会话验证：token 解析失败", { fp });
    safeRemove(TOKEN_KEY);
    return { authed: false };
  }
}

/** 登出，清除 token */
export async function logout(): Promise<void> {
  const fp = browserFingerprint();
  safeRemove(TOKEN_KEY);
  logger.info("Auth", "主动登出", { fp });
  reportAuthEvent("info", "👋 主动登出", fp);
}
