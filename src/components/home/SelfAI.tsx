import { useCallback, useEffect, useRef, useState } from "react";
import * as Icons from "lucide-react";

/**
 * SelfAI：自研 AI 展示与对话区
 * ---------------------------------------------------------------
 * 设计说明：
 *   1. 前端只负责 UI 与会话状态。推理有两种后端，靠 ENDPOINT 自动区分：
 *      · 本机直连：ai_server.py（127.0.0.1:7860），走 /api/health、/api/chat
 *      · 云端代理：Netlify Function（/.netlify/functions/ai），GET/POST 同一路径
 *      Key 全部保存在服务端环境变量，前端拿不到，也不会消耗访客设备算力。
 *   2. 轮询健康接口判断引擎是否在线；离线时明确提示，不伪造回答。
 *   3. 商用联系信息按作者要求公开展示：张柏慈 / 15945033555 / 周六周日。
 */

const ENV_ENDPOINT = (import.meta.env.VITE_AI_ENDPOINT as string | undefined)?.replace(/\/+$/, "");
/** 默认走同域 Netlify Function；本地开发可用 VITE_AI_ENDPOINT 指向 127.0.0.1:7860 */
const ENDPOINT = ENV_ENDPOINT ?? "/.netlify/functions/ai";
/** 本机直连模式用的是子路径，云端函数模式同一路径即可 */
const DIRECT = /^https?:\/\/(127\.0\.0\.1|localhost)/.test(ENDPOINT);
const HEALTH_URL = DIRECT ? `${ENDPOINT}/api/health` : ENDPOINT;
const CHAT_URL = DIRECT ? `${ENDPOINT}/api/chat` : ENDPOINT;

type Role = "user" | "assistant";
interface ChatMsg {
  role: Role;
  content: string;
}
type EngineStatus = "checking" | "online" | "offline";

/** 30 秒超时保护：本地 CPU 推理较慢，避免请求永远挂起 */
function timeoutSignal(ms: number): AbortSignal {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl.signal;
}

export default function SelfAI() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<EngineStatus>("checking");
  const listRef = useRef<HTMLDivElement>(null);

  /* 引擎健康探测：进入页面先查一次，之后每 15 秒复查 */
  useEffect(() => {
    let alive = true;
    const probe = async () => {
      try {
        const res = await fetch(HEALTH_URL, { signal: timeoutSignal(2500) });
        const data = (await res.json()) as { ok?: boolean };
        if (alive) setStatus(data?.ok ? "online" : "offline");
      } catch {
        if (alive) setStatus("offline");
      }
    };
    void probe();
    const timer = setInterval(() => void probe(), 15000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  /* 新消息自动滚到底部 */
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || pending) return;
    const history: ChatMsg[] = [
      ...messages,
      { role: "user" as const, content: text },
    ].slice(-8);
    setMessages(history);
    setInput("");
    setPending(true);
    try {
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: timeoutSignal(30000),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) throw new Error(data.error || "引擎无响应");
      setMessages([...history, { role: "assistant", content: data.reply }]);
      setStatus("online");
    } catch (err) {
      setStatus("offline");
      const reason = err instanceof Error ? err.message : "未知错误";
      setMessages([
        ...history,
        {
          role: "assistant",
          content: DIRECT
            ? `⚠ 本地引擎未连接（${reason}）。\n请确认已运行 ai_server.py，且端口 7860 未被占用。`
            : `⚠ 云端引擎暂时不可用（${reason}）。请稍后再试。`,
        },
      ]);
    } finally {
      setPending(false);
    }
  }, [input, messages, pending]);

  const statusText =
    status === "online"
      ? DIRECT ? "本地引擎在线" : "云端引擎在线"
      : status === "checking"
        ? "正在探测引擎…"
        : "引擎离线";
  const statusColor =
    status === "online" ? "bg-emerald-400" : status === "checking" ? "bg-amber-400" : "bg-rose-500";
  const engineLabel = DIRECT ? "自研 AI · 本地微调引擎" : "自研 AI · 云端引擎";
  const engineDetail = DIRECT ? "Qwen2-0.5B + LoRA · 纯本地推理" : "服务端推理 · 不占用访客设备";

  return (
    <section className="relative z-10 px-4 pb-4 pt-2 sm:px-6">
      <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-fuchsia-400/30 bg-white/[0.04] backdrop-blur-md">
        {/* ── 顶部：自研 AI 标识 + 商用联系方式（显著标注） ── */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-fuchsia-400/20 bg-gradient-to-r from-fuchsia-500/15 via-purple-500/10 to-cyan-400/10 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-glow-xs">
              <Icons.BrainCircuit size={17} className="text-white" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-wide text-white">{engineLabel}</span>
                <span className="rounded-full border border-fuchsia-300/40 bg-fuchsia-500/20 px-2 py-0.5 text-[10px] font-bold tracking-widest text-fuchsia-200">
                  SELF-DEVELOPED
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-muted">
                <span className={`h-1.5 w-1.5 rounded-full ${statusColor} ${status === "online" ? "animate-pulse" : ""}`} />
                {statusText}
                <span className="opacity-60">· {engineDetail}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-fuchsia-200">
            <Icons.Phone size={12} />
            <span>商用授权：张柏慈</span>
            <a href="tel:15945033555" className="text-white underline decoration-fuchsia-300/60 underline-offset-2 hover:text-fuchsia-200">
              15945033555
            </a>
            <span className="text-ink-muted">（周六 / 周日在线）</span>
          </div>
        </div>

        {/* ── 对话区 ── */}
        <div className="px-4 py-3">
          <div
            ref={listRef}
            className="h-[168px] space-y-2 overflow-y-auto pr-1 text-[13px] leading-relaxed"
          >
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-[12px] text-ink-muted">
                <Icons.Sparkles size={18} className="text-fuchsia-300/80" />
                <p>{DIRECT ? "这是由本人自行训练并部署的本地 AI，不调用任何第三方大模型接口。" : "这是由张柏慈部署的 AI 助手，可直接提问。"}</p>
                <p className="opacity-70">{DIRECT ? "启动 ai_server.py 后即可对话；离线时不会伪造回答。" : "引擎在线即可对话；离线时不会伪造回答。"}</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[86%] whitespace-pre-wrap rounded-xl px-3 py-2 ${
                    m.role === "user"
                      ? "bg-cyan-400/15 text-cyan-50"
                      : "border border-fuchsia-400/20 bg-fuchsia-500/10 text-ink"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {pending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-2 text-ink-muted">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-fuchsia-300" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-fuchsia-300 [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-fuchsia-300 [animation-delay:240ms]" />
                </div>
              </div>
            )}
          </div>

          {/* ── 输入行 ── */}
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <Icons.Terminal size={14} className="shrink-0 text-fuchsia-300/80" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder={status === "online" ? "向自研 AI 提问…" : "引擎离线，仍可输入（发送会提示连接失败）"}
              className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-muted/70"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={pending || !input.trim()}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-gradient-to-r from-fuchsia-500 to-purple-600 px-3 py-1.5 text-[12px] font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icons.Send size={12} />
              发送
            </button>
          </div>

          {/* ── 法律免责声明（醒目告知，禁止违法用途） ── */}
          <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[11px] leading-relaxed text-rose-200">
            <Icons.ShieldAlert size={13} className="mt-0.5 shrink-0" />
            <p>
              <span className="font-bold text-rose-300">法律声明：</span>
              本 AI 仅限合法用途，<span className="font-bold">严禁用于非法贷款、诈骗、赌博、洗钱等任何违法犯罪活动</span>；
              违者由<span className="font-bold">使用者自行承担全部法律责任及后果</span>，作者张柏慈将依法申诉、举报并保留追究其法律责任的权利。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
