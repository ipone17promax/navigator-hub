import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { logger, type LogEntry, type LogLevel } from "@/lib/logger";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";

/**
 * 内部调试面板（仅 admin 状态渲染）
 *
 * 改造自原客户端密码版本：移除 internalAuth 依赖与 PasswordCard，
 * 身份验证由 useAuthStore + 服务器端 Edge Function 完成。
 *
 * 快捷键：Ctrl+Shift+L 开关抽屉
 */

type FilterLevel = "all" | LogLevel;

const LEVEL_META: Record<LogLevel, { label: string; color: string; dot: string }> = {
  info: { label: "Info", color: "text-cyan-400", dot: "bg-cyan-400" },
  warn: { label: "Warn", color: "text-amber-400", dot: "bg-amber-400" },
  error: { label: "Error", color: "text-red-400", dot: "bg-red-400" },
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

function estimateSize(logs: LogEntry[]): string {
  try {
    const bytes = new Blob([JSON.stringify(logs)]).size;
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  } catch {
    return "—";
  }
}

// ============================================================
// 主组件
// ============================================================
export default function InternalDebugPanel() {
  const status = useAuthStore((s) => s.status);
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin);
  const logout = useAuthStore((s) => s.logout);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [level, setLevel] = useState<FilterLevel>("all");
  const [logs, setLogs] = useState<LogEntry[]>(() => logger.getLogs());

  // 订阅 logger 实时更新
  useEffect(() => logger.subscribe(setLogs), []);

  // Ctrl+Shift+L 切换抽屉（仅特级管理员）
  useEffect(() => {
    if (status !== "admin" || !isSuperAdmin) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "l" || e.key === "L")) {
        e.preventDefault();
        setDrawerOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, isSuperAdmin]);

  // 仅特级管理员渲染
  if (status !== "admin" || !isSuperAdmin) return null;

  const filtered = level === "all" ? logs : logs.filter((l) => l.level === level);

  return (
    <>
      <FloatingButton onClick={() => setDrawerOpen(true)} count={logs.length} />
      {drawerOpen && (
        <Drawer
          level={level}
          setLevel={setLevel}
          logs={filtered}
          total={logs.length}
          onClose={() => setDrawerOpen(false)}
          onLogout={async () => {
            await logout();
            setDrawerOpen(false);
          }}
        />
      )}
    </>
  );
}

// ============================================================
// 浮动按钮
// ============================================================
function FloatingButton({ onClick, count }: { onClick: () => void; count: number }) {
  return (
    <button
      onClick={onClick}
      title="内部调试面板（Ctrl+Shift+L）"
      aria-label="打开内部调试面板"
      className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-lg"
    >
      <Icons.Bug size={20} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

// ============================================================
// 抽屉
// ============================================================
function Drawer(props: {
  level: FilterLevel;
  setLevel: (l: FilterLevel) => void;
  logs: LogEntry[];
  total: number;
  onClose: () => void;
  onLogout: () => void;
}) {
  const { level, setLevel, logs, total, onClose, onLogout } = props;
  const [copied, setCopied] = useState(false);

  const copyAll = async () => {
    const text = JSON.stringify(logs, null, 2);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `navhub-logs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filterBtns: { key: FilterLevel; label: string }[] = [
    { key: "all", label: "全部" },
    { key: "info", label: "Info" },
    { key: "warn", label: "Warn" },
    { key: "error", label: "Error" },
  ];

  return (
    <div className="fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-stroke bg-bg-elevate/95 shadow-card backdrop-blur-xl animate-fade-in-up sm:w-[480px]">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between border-b border-stroke px-4 py-3">
        <div className="flex items-center gap-2">
          <Icons.Terminal size={16} className="text-brand-primary" />
          <span className="text-sm font-semibold text-ink">运行时日志</span>
          <span className="text-[10px] text-ink-subtle">仅管理员可见</span>
        </div>
        <button
          onClick={onClose}
          title="关闭（Ctrl+Shift+L）"
          className="rounded-md p-1 text-ink-subtle transition-colors hover:bg-white/10 hover:text-ink"
        >
          <Icons.X size={16} />
        </button>
      </div>

      {/* 过滤栏 */}
      <div className="flex items-center gap-1.5 border-b border-stroke/50 px-4 py-2">
        {filterBtns.map((b) => (
          <button
            key={b.key}
            onClick={() => setLevel(b.key)}
            className={cn(
              "rounded-md border px-2 py-0.5 text-[11px] transition-colors",
              level === b.key
                ? "border-brand-primary/50 bg-brand-primary/20 text-brand-primary"
                : "border-stroke text-ink-subtle hover:bg-white/10 hover:text-ink",
            )}
          >
            {b.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={copyAll}
            title="复制全部日志"
            className="flex items-center gap-1 rounded-md border border-stroke px-2 py-0.5 text-[11px] text-ink-subtle transition-colors hover:bg-white/10 hover:text-ink"
          >
            {copied ? <Icons.Check size={11} className="text-green-400" /> : <Icons.Copy size={11} />}
            {copied ? "已复制" : "复制"}
          </button>
          <button
            onClick={downloadJson}
            title="下载为 JSON"
            className="flex items-center gap-1 rounded-md border border-stroke px-2 py-0.5 text-[11px] text-ink-subtle transition-colors hover:bg-white/10 hover:text-ink"
          >
            <Icons.Download size={11} />
            下载
          </button>
          <button
            onClick={() => logger.clear()}
            title="清空全部日志"
            className="flex items-center gap-1 rounded-md border border-stroke px-2 py-0.5 text-[11px] text-ink-subtle transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <Icons.Trash2 size={11} />
            清空
          </button>
          <button
            onClick={onLogout}
            title="登出管理员"
            className="flex items-center gap-1 rounded-md border border-stroke px-2 py-0.5 text-[11px] text-ink-subtle transition-colors hover:bg-white/10 hover:text-ink"
          >
            <Icons.LogOut size={11} />
            登出
          </button>
        </div>
      </div>

      {/* 日志列表 */}
      <div className="flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-subtle">
            <Icons.Inbox size={32} className="opacity-40" />
            <span className="text-xs">暂无日志</span>
            <span className="text-[10px]">操作页面（搜索/切换主题/路由跳转）后会自动记录</span>
          </div>
        ) : (
          logs.map((entry) => <LogRow key={entry.id} entry={entry} />)
        )}
      </div>

      {/* 底部统计 */}
      <div className="flex items-center justify-between border-t border-stroke px-4 py-2 text-[11px] text-ink-subtle">
        <span>
          显示 {logs.length} / 共 {total} 条
        </span>
        <span>约 {estimateSize(logs)}</span>
      </div>
    </div>
  );
}

// ============================================================
// 单条日志行
// ============================================================
function LogRow({ entry }: { entry: LogEntry }) {
  const meta = LEVEL_META[entry.level];
  const hasData = entry.data !== undefined && entry.data !== null;

  return (
    <div className="border-b border-stroke/50 px-3 py-2 transition-colors hover:bg-white/5">
      <div className="flex items-start gap-2">
        <span className={`mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${meta.dot}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[10px] text-ink-subtle">{formatTime(entry.ts)}</span>
            <span className={cn("text-[10px] font-semibold uppercase", meta.color)}>
              {entry.level}
            </span>
            <span className="rounded bg-white/5 px-1 text-[10px] font-medium text-ink-muted">
              {entry.tag}
            </span>
          </div>
          <div className="mt-0.5 break-words text-xs text-ink">{entry.message}</div>
          {hasData && (
            <details className="mt-1">
              <summary className="cursor-pointer text-[10px] text-ink-subtle hover:text-ink">
                展开 data
              </summary>
              <pre className="mt-1 overflow-x-auto rounded bg-bg-base/60 p-2 text-[10px] leading-relaxed text-ink-muted">
                {JSON.stringify(entry.data, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
