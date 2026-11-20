import { useEffect, useRef, useState } from "react";
import * as Icons from "@/lib/iconRegistry";
import { useI18n } from "@/i18n";
import { useAppStore } from "@/stores/useAppStore";
import {
  checkLocalModel,
  chatWithLocalModel,
  offlineReply,
  type AiMessage,
  type AiReply,
} from "@/lib/localAi";

type ChatMsg = {
  role: "user" | "assistant";
  content: string;
  links?: { label: string; url: string }[];
};

/**
 * 本地 AI 助手（不接云端 API）
 * - 本机 ai_server.py 在线：走 Qwen2-0.5B + LoRA
 * - 离线 / HTTPS 混合内容被拦：自动回退内置知识库应答
 */
export default function AiAssistant() {
  const { locale, toggleTheme } = useI18n();
  const zh = locale === "zh";
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"checking" | "local" | "offline">("checking");
  const [model, setModel] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content: zh
        ? "你好，我是 NavigatorHub 的本地 AI 助手。可以帮你找站点、打开工具、查天气、切换主题或开启老人模式，不调用云端 API。"
        : "Hi, I'm NavigatorHub's local assistant. I can find sites, open tools, show weather, switch theme or elder mode. No cloud API.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
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

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content }]);
    setBusy(true);
    try {
      let reply: AiReply;
      if (mode === "local") {
        try {
          const history: AiMessage[] = [
            ...messages.map((m): AiMessage => ({ role: m.role, content: m.content })),
            { role: "user", content },
          ];
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
      setMessages((m) => [...m, { role: "assistant", content: reply.text, links: reply.links }]);
    } finally {
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
    mode === "local"
      ? zh
        ? `本地模型已连接${model ? " · " + model : ""}`
        : `Local model · ${model}`
      : mode === "offline"
        ? zh
          ? "离线知识库模式"
          : "Offline knowledge base"
        : zh
          ? "检测本地模型…"
          : "Checking local model…";
  const statusColor = mode === "local" ? "bg-emerald-400" : mode === "offline" ? "bg-sky-400" : "bg-amber-400";

  const quick = zh
    ? ["推荐 AI 网站", "打开二维码工具", "今天天气", "快捷键"]
    : ["AI sites", "Open QR tool", "Weather", "Shortcuts"];

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={zh ? "打开本地 AI 助手" : "Open local AI assistant"}
        className="ai-fab fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient text-white shadow-glow transition-transform hover:-translate-y-0.5 active:scale-95"
      >
        <Icons.Sparkles size={20} />
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-bg-base bg-emerald-400" />
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
            <div className="text-[13px] font-semibold text-ink">
              {zh ? "Navigator AI · 本地" : "Navigator AI · Local"}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-ink-subtle">
              <span className={`h-1.5 w-1.5 rounded-full ${statusColor}`} />
              {statusText}
            </div>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
          aria-label={zh ? "关闭" : "Close"}
        >
          <Icons.X size={14} />
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed ${
                m.role === "user" ? "bg-brand-gradient text-white" : "bg-white/5 text-ink/85"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>
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
            placeholder={zh ? "问点什么…（不联网）" : "Ask anything… (offline)"}
            className="min-w-0 flex-1 bg-transparent px-1.5 py-1 text-[12px] text-ink outline-none placeholder:text-ink-subtle"
          />
          <button
            onClick={() => void send()}
            disabled={busy || !input.trim()}
            className="rounded-lg bg-brand-gradient px-2.5 py-1.5 text-white disabled:opacity-40"
            aria-label={zh ? "发送" : "Send"}
          >
            <Icons.ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}