import { create } from "zustand";
import {
  login as apiLogin,
  verify as apiVerify,
  logout as apiLogout,
  isLoginSuccess,
  isAuthed,
  isSuperAdmin,
  type LoginResult,
} from "@/lib/authClient";
import { __setConsoleMirror, logger } from "@/lib/logger";

/**
 * 身份认证状态管理
 *
 * status 三态：
 *   loading — 初始化中（首次加载，等 verify 返回）
 *   admin   — 已通过访问码验证（password-01 至 password-99）
 *   guest   — 未验证或验证失败（通用用户，看精简公开版）
 *
 * isSuperAdmin：
 *   true  — password-01 特级管理员（创作者，可查看认证日志）
 *   false — password-02~99 普通管理员（可使用管理功能，不可查看认证日志）
 *
 * token 存于 sessionStorage：关闭网页自动失效，刷新/后台保持登录。
 * init() 有 initStarted 守卫，StrictMode 双调用安全。
 * 身份状态变化时同步切换 logger 的 console 镜像。
 */

interface AuthState {
  status: "loading" | "admin" | "guest";
  userId: string | null;
  isSuperAdmin: boolean; // 是否为特级管理员（password-01）
  lockedUntil: number | null;
  initStarted: boolean;
  init: () => Promise<void>;
  login: (uid: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  setLockedUntil: (t: number | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "loading",
  userId: null,
  isSuperAdmin: false,
  lockedUntil: null,
  initStarted: false,

  init: async () => {
    if (get().initStarted) return;
    set({ initStarted: true });
    logger.info("AuthStore", "身份初始化开始");
    try {
      localStorage.removeItem("navhub:internal");
      localStorage.removeItem("navhub:internalFail");
    } catch {
      /* ignore */
    }
    const r = await apiVerify();
    if (isAuthed(r)) {
      const isSuper = isSuperAdmin(r.userId);
      set({ status: "admin", userId: r.userId, isSuperAdmin: isSuper });
      __setConsoleMirror(true);
      logger.info("AuthStore", "身份确认：管理员", { userId: r.userId, isSuperAdmin: isSuper });
    } else {
      set({ status: "guest", isSuperAdmin: false });
      __setConsoleMirror(false);
      logger.info("AuthStore", "身份确认：访客");
    }
  },

  login: async (uid: string) => {
    const r = await apiLogin(uid);
    if (isLoginSuccess(r)) {
      const isSuper = isSuperAdmin(r.userId);
      set({ status: "admin", userId: r.userId, isSuperAdmin: isSuper, lockedUntil: null });
      __setConsoleMirror(true);
      logger.info("AuthStore", "状态切换：guest → admin", { userId: r.userId, isSuperAdmin: isSuper });
      return r;
    }
    if (r.reason === "locked" && r.lockedUntil) {
      set({ lockedUntil: r.lockedUntil });
      logger.warn("AuthStore", "登录锁定", { reason: r.reason });
    } else {
      logger.warn("AuthStore", "登录失败", { reason: r.reason });
    }
    return r;
  },

  logout: async () => {
    await apiLogout();
    set({ status: "guest", userId: null, isSuperAdmin: false, lockedUntil: null });
    __setConsoleMirror(false);
    logger.info("AuthStore", "状态切换：admin → guest（主动登出）");
  },

  setLockedUntil: (t) => set({ lockedUntil: t }),
}));
