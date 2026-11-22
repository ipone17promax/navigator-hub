import { useEffect, useRef, useState } from "react";
import * as Icons from "@/lib/iconRegistry";
import { useI18n } from "@/i18n";
import { useAppStore } from "@/stores/useAppStore";
import {
  chatWithLocalModel,
  chatWithZhipuStream,
  checkLocalModel,
  getZhipuKey,
  getZhipuProxy,
  offlineReply,
  setZhipuKey,
  setZhipuProxy,
  type AiMessage,
  type AiReply,
} from "@/lib/localAi";

type ChatMsg = {
  role: "user" | "assistant";
  content: string;
  links?: { label: string; url: string }[];
};

type Mode = "checking" | "zhipu" | "local" | "offline";

/**
 * AI 助手（三模）
 * 1) 云端智谱 GLM：经自建 Worker 代理（官方接口无 CORS）
 * 2) 本地模型：ai_server.py 的 Qwen2-0.5B + LoRA
 * 3) 离线知识库：不联网的规则应答
 */
export default function AiAssistant() {
  const { locale, toggleTheme } = useI18n();
  const zh = locale === "zh";
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("checking");
  const [model, setModel] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [keyDraft, setKeyDraft] = useState(getZhipuKey());
  const [proxyDraft, setProxyDraft] = useState(getZhipuProxy());
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content: zh
        ? "你好，我是 NavigatorHub 的 AI 助手。配置智谱代理后使用云端 GLM，本机服务在线时用本地 Qwen，都不可用时走离线知识库。"
        : "Hi, I'm NavigatorHub's assistant. It uses Zhipu GLM via proxy, a local Qwen model, or the offline knowledge base.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    const proxy = getZhipuProxy();
    if (proxy) {
      setMode("zhipu");
      setModel("glm-4-flash");
      return;
    }
    setMode("checking");
    void checkLocalModel().then((r) => {
      if (!alive) return;
      if (r.ok) {
        setMode("local");
        setModel(r.model || "Qwen2-0.5B");
      } else {
        setMode("offline");
      }
    });
    return () => {
      alive = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, busy, open]);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  function saveConfig() {
    setZhipuKey(keyDraft);
    setZhipuProxy(proxyDraft);
    const proxy = getZhipuProxy();
    setShowConfig(false);
    if (proxy) {
      setMode("zhipu");
      setModel("glm-4-flash");
    } else {
      setMode("offline");
      setModel("");
    }
  }

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content }]);
    setBusy(true);
    try {
      let reply: AiReply;
      // 只带最近 10 条，避免长对话超 token / 请求超时
      const history: AiMessage[] = [
        ...messages.slice(-10).map((m): AiMessage => ({ role: m.role, content: m.content })),
        { role: "user", content },
      ];

      let streamed = false;
      if (mode === "zhipu") {
        try {
          // 先插入空消息，随后按 SSE 增量更新
          setMessages((m) => [...m, { role: "assistant", content: "" }]);
          let acc = "";
          const ctrl = new AbortController();
          abortRef.current = ctrl;
          const text = await chatWithZhipuStream(history, getZhipuKey(), getZhipuProxy(), (delta) => {
            acc += delta;
            setMessages((m) => {
              if (!m.length) return m;
              const next = m.slice();
              next[next.length - 1] = { role: "assistant", content: acc };
              return next;
            });
          }, ctrl.signal);
          const finalText = text || acc;
          setMessages((m) => {
            if (!m.length) return m;
            const next = m.slice();
            next[next.length - 1] = { role: "assistant", content: finalText };
            return next;
          });
          reply = { text: finalText, source: "zhipu" };
          streamed = true;
        } catch (err) {
          if ((err as Error)?.name === "AbortError") {
            // 用户主动停止：保留已生成内容，保持云端模式
            setMessages((m) => {
              const last = m[m.length - 1];
              if (last && last.role === "assistant" && !last.content && !last.links) return m.slice(0, -1);
              return m;
            });
            streamed = true;
            return;
          }
          const msg = String((err as Error)?.message || "");
          const rateLimited = /rate limited|429/i.test(msg);
          reply = offlineReply(content, { locale: zh ? "zh" : "en" });
          reply.text =
            (rateLimited
              ? zh
                ? "请求太频繁，稍等几秒再问。"
                : "Too many requests. Wait a few seconds."
              : zh
                ? "智谱云端连接失败（检查代理地址与 Key），已切换离线模式。"
                : "Zhipu cloud failed (check proxy and key), switched to offline.") +
            "\n" +
            reply.text;
          // 移除空的流式占位消息，改走离线回复
          setMessages((m) => {
            const last = m[m.length - 1];
            if (last && last.role === "assistant" && !last.content && !last.links) return m.slice(0, -1);
            return m;
          });
          // 限流只是暂时的，保持云端模式；其它错误才回退离线
          if (!rateLimited) {
            setMode("offline");
            setModel("");
          }
        }
      } else if (mode === "local") {
        try {
          const r = await chatWithLocalModel(history);
          reply = { text: r, source: "local-model" };
        } catch {
          setMode("offline");
          reply = offlineReply(content, { locale: zh ? "zh" : "en" });
        }
      } else {
        reply = offlineReply(content, { locale: zh ? "zh" : "en" });
      }

      if (reply.action === "elder") useAppStore.getState().toggleElderlyMode();
      if (reply.action === "theme") toggleTheme();
      if (!streamed) {
        setMessages((m) => [...m, { role: "assistant", content: reply.text, links: reply.links }]);
      }
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  }

  function openLink(url: string) {
    if (url.startsWith("/")) {
      window.location.hash = "#" + url;
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const statusText =
    mode === "zhipu"
      ? zh
        ? `云端智谱 · ${model || "glm-4-flash"}`
        : `Zhipu GLM · ${model || "glm-4-flash"}`
      : mode === "local"
        ? zh
          ? `本地模型已连接${model ? " · " + model : ""}`
          : `Local model · ${model}`
        : mode === "offline"
          ? zh
            ? "离线知识库模式"
            : "Offline knowledge base"
          : zh
            ? "检测可用模型…"
            : "Checking model…";
  const statusColor =
    mode === "zhipu"
      ? "bg-fuchsia-400"
      : mode === "local"
        ? "bg-emerald-400"
        : mode === "offline"
          ? "bg-sky-400"
          : "bg-amber-400";

  const quick = zh
    ? ["推荐 AI 网站", "打开二维码工具", "今天天气", "快捷键"]
    : ["AI sites", "Open QR tool", "Weather", "Shortcuts"];

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={zh ? "打开 AI 助手" : "Open AI assistant"}
        className="ai-fab fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient text-white shadow-glow transition-transform hover:-translate-y-0.5 active:scale-95"
      >
        <Icons.Sparkles size={20} />
        <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-bg-base ${statusColor}`} />
      </button>
    );
  }

  return (
    <div className="ai-panel fixed bottom-24 right-3 z-50 flex max-h-[min(72vh,560px)] w-[min(94vw,380px)] flex-col overflow-hidden rounded-2xl border border-stroke bg-bg-base/95 shadow-card backdrop-blur-xl animate-fade-in-up">
      <div className="flex items-center justify-between border-b border-stroke px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gradient text-white">
            <Icons.Sparkles size={14} />
          </span>
          <div>
            <div className="text-[13px] font-semibold text-ink">Navigator AI</div>
            <div className="flex items-center gap-1 text-[10px] text-ink-subtle">
              <span className={`h-1.5 w-1.5 rounded-full ${statusColor}`} />
              {statusText}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowConfig((v) => !v)}
            className={`rounded-lg p-1.5 transition-colors hover:bg-white/5 ${showConfig ? "text-amber-300" : "text-ink-muted hover:text-ink"}`}
            title={zh ? "配置智谱云端" : "Configure Zhipu cloud"}
            aria-label={zh ? "配置智谱云端" : "Configure Zhipu cloud"}
          >
            <Icons.Lock size={14} />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
            aria-label={zh ? "关闭" : "Close"}
          >
            <Icons.X size={14} />
          </button>
        </div>
      </div>

      {showConfig && (
        <div className="space-y-2 border-b border-stroke bg-white/[0.03] px-3.5 py-2.5">
          <input
            type="password"
            value={keyDraft}
            onChange={(e) => setKeyDraft(e.target.value)}
            placeholder={zh ? "智谱 API Key（Worker 配了 Secret 可留空）" : "Zhipu key (leave empty if Worker has a secret)"}
            className="w-full rounded-lg border border-stroke bg-bg-elevate/60 px-2.5 py-1.5 text-[11px] text-ink outline-none placeholder:text-ink-subtle focus:border-brand-primary"
          />
          <input
            value={proxyDraft}
            onChange={(e) => setProxyDraft(e.target.value)}
            placeholder={zh ? "Worker 代理地址（https://xxx.workers.dev）" : "Worker proxy URL (https://xxx.workers.dev)"}
            className="w-full rounded-lg border border-stroke bg-bg-elevate/60 px-2.5 py-1.5 text-[11px] text-ink outline-none placeholder:text-ink-subtle focus:border-brand-primary"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={saveConfig}
              className="rounded-lg border border-stroke px-2.5 py-1.5 text-[11px] text-ink transition-colors hover:bg-white/5"
            >
              {zh ? "保存" : "Save"}
            </button>
            <p className="text-[10px] leading-relaxed text-ink-subtle">
              {zh ? "Key 与代理地址仅存本机；智谱官方接口无 CORS，必须走代理。" : "Key and proxy stay in this browser; Zhipu needs a CORS proxy."}
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed ${
                m.role === "user" ? "bg-brand-gradient text-white" : "bg-white/5 text-ink/85"
              }`}
            >
              <div className="whitespace-pre-wrap">
                {m.content}
                {busy && i === messages.length - 1 && m.role === "assistant" && (
                  <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-ink/60 align-middle" />
                )}
              </div>
              {m.links && m.links.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.links.map((l) => (
                    <button
                      key={l.url + l.label}
                      onClick={() => openLink(l.url)}
                      className="rounded-lg border border-stroke bg-bg-elevate/60 px-2 py-1 text-[11px] text-ink transition-colors hover:border-stroke-hover hover:bg-white/10"
                    >
                      {l.label} ↗
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl bg-white/5 px-3 py-2">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-subtle" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-subtle [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-subtle [animation-delay:240ms]" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex gap-1.5 overflow-x-auto px-3 pb-2 [scrollbar-width:none]">
        {quick.map((q) => (
          <button
            key={q}
            onClick={() => void send(q)}
            className="shrink-0 rounded-full border border-stroke bg-white/5 px-2.5 py-1 text-[10px] text-ink-muted transition-colors hover:text-ink"
          >
            {q}
          </button>
        ))}
      </div>

      <div className="border-t border-stroke p-2.5">
        <div className="flex items-end gap-2 rounded-xl border border-stroke bg-bg-elevate/60 p-1.5">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={zh ? "问点什么…" : "Ask anything…"}
            className="min-w-0 flex-1 bg-transparent px-1.5 py-1 text-[12px] text-ink outline-none placeholder:text-ink-subtle"
          />
          {busy ? (
            <button
              onClick={() => abortRef.current?.abort()}
              className="rounded-lg border border-stroke bg-white/5 px-2.5 py-1.5 text-ink transition-colors hover:bg-white/10"
              aria-label={zh ? "停止生成" : "Stop"}
              title={zh ? "停止生成" : "Stop"}
            >
              <Icons.X size={14} />
            </button>
          ) : (
            <button
              onClick={() => void send()}
              disabled={!input.trim()}
              className="rounded-lg bg-brand-gradient px-2.5 py-1.5 text-white disabled:opacity-40"
              aria-label={zh ? "发送" : "Send"}
            >
              <Icons.ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}