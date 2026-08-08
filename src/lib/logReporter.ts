/**
 * 远程日志上报模块（ntfy.sh）
 *
 * 将管理员认证关键事件推送到 ntfy.sh，创作者可远程实时查看登录记录。
 * - 完全免费、无需注册、无需 API Key
 * - fire-and-forget：不阻塞主流程，失败静默
 * - 只上报认证关键事件，不上报普通业务日志
 * - 访问码已脱敏（**-01），不泄露完整密码
 *
 * 查看方式：
 *   浏览器打开 https://ntfy.sh/navhub-auth-9f3a7c1e5b2d8a4f
 *   或安装 ntfy App 订阅同一话题
 */

// 话题名：随机字符串，不易被猜到
const NTFY_TOPIC = "navhub-auth-9f3a7c1e5b2d8a4f";
const NTFY_URL = `https://ntfy.sh/${NTFY_TOPIC}`;

export type AuthEventLevel = "info" | "warn" | "error";

// ntfy 优先级映射
const PRIORITY_MAP: Record<AuthEventLevel, string> = {
  info: "default",
  warn: "high",
  error: "urgent",
};

// ntfy 标签映射（emoji）
const TAGS_MAP: Record<AuthEventLevel, string> = {
  info: "information_source",
  warn: "warning",
  error: "rotating_light",
};

/**
 * 上报认证事件到 ntfy.sh
 * fire-and-forget：不阻塞、不抛错、不影响登录流程
 */
export function reportAuthEvent(level: AuthEventLevel, title: string, body: string): void {
  try {
    fetch(NTFY_URL, {
      method: "POST",
      headers: {
        Title: title,
        Priority: PRIORITY_MAP[level],
        Tags: TAGS_MAP[level],
      },
      body,
      // 静默失败：不希望日志上报影响用户体验
      keepalive: true,
    }).catch(() => {
      /* 网络错误静默忽略 */
    });
  } catch {
    /* 静默忽略 */
  }
}
