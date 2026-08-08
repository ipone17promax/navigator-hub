import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { isLoginSuccess } from "@/lib/authClient";

/**
 * 管理员访问码登录卡
 *
 * 用户输入访问码（password-01 至 password-99），前端做格式预检，
 * 签发 HMAC-SHA256 签名 token 存入 localStorage。
 */

const ID_RE = /^password-(\d{2})$/i;

export default function LoginCard({ onClose }: { onClose?: () => void }) {
  const login = useAuthStore((s) => s.login);
  const lockedUntil = useAuthStore((s) => s.lockedUntil);
  const setLockedUntil = useAuthStore((s) => s.setLockedUntil);

  const [uid, setUid] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(Date.now());

  // 锁定倒计时
  useEffect(() => {
    if (!lockedUntil) return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= (lockedUntil ?? 0)) {
        setLockedUntil(null);
        clearInterval(t);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [lockedUntil, setLockedUntil]);

  const isLocked = !!(lockedUntil && now < lockedUntil);
  const remainingSec = isLocked ? Math.ceil((lockedUntil! - now) / 1000) : 0;

  const submit = async () => {
    if (!uid || submitting || isLocked) return;
    const normalized = uid.toLowerCase();
    // 客户端格式预检（减少无效请求，服务器仍独立校验）
    if (!ID_RE.test(normalized)) {
      setError("访问码格式不正确");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const r = await login(normalized);
      if (isLoginSuccess(r)) {
        setUid("");
        onClose?.();
        return;
      }
      // r 在此处收窄为 { ok: false; reason: ...; lockedUntil?: number }
      if (r.reason === "locked") {
        // lockedUntil 已由 store 设置
      } else if (r.reason === "network") {
        setError("网络异常，请重试");
      } else if (r.reason === "bad_request") {
        setError("请求格式错误");
      } else {
        setError("访问码无效");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-up">
      <div className="relative w-11/12 max-w-sm rounded-2xl border border-stroke bg-bg-elevate/95 p-5 shadow-card">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-md p-1 text-ink-subtle transition-colors hover:bg-white/10 hover:text-ink"
            aria-label="关闭"
          >
            <Icons.X size={16} />
          </button>
        )}
        <div className="mb-4 flex items-center gap-2">
          <Icons.ShieldCheck size={18} className="text-brand-primary" />
          <span className="text-base font-semibold text-ink">管理员访问</span>
        </div>
        <input
          type="text"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
          disabled={isLocked}
          placeholder="请输入访问码"
          maxLength={11}
          autoFocus
          className="block w-full rounded-lg border border-stroke bg-white px-3 py-2.5 text-sm text-black placeholder:text-gray-400 outline-none transition-colors focus:border-brand-primary/50 disabled:opacity-50"
        />
        {error && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
            <Icons.AlertCircle size={12} />
            {error}
          </div>
        )}
        {isLocked && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400">
            <Icons.Lock size={12} />
            已锁定，剩余 {Math.floor(remainingSec / 60)}:{String(remainingSec % 60).padStart(2, "0")}
          </div>
        )}
        <button
          onClick={() => void submit()}
          disabled={isLocked || submitting || !uid}
          className="mt-3 w-full rounded-lg bg-brand-gradient px-3 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {submitting ? "验证中…" : "验证访问码"}
        </button>
        <div className="mt-3 text-center text-[10px] text-ink-subtle">
          仅管理员使用 · 3 次失败锁定 5 分钟
        </div>
      </div>
    </div>
  );
}
