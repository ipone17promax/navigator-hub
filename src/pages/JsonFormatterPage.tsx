import { useMemo, useState } from "react";
import { ArrowLeft, Braces, Check, Copy, Minimize2, Sparkles, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "@/i18n";

const L = {
  zh: {
    title: "JSON 格式化",
    subtitle: "本地解析 · 不联网 · 报错直接给到行列位置",
    input: "原始 JSON",
    output: "格式化结果",
    ph: '{"hello":"world","list":[1,2,3]}',
    format: "格式化",
    minify: "压缩",
    sort: "键名排序",
    copy: "复制结果",
    copied: "已复制",
    clear: "清空",
    ok: "解析成功",
    bytes: "字节",
    empty: "粘贴 JSON 后点击格式化",
    error: "解析失败",
    back: "返回导航中心",
    tool: "JSON 格式化 v1.0",
    sample: "示例",
  },
  en: {
    title: "JSON Formatter",
    subtitle: "Parsed locally — no network. Errors point to the exact position.",
    input: "Raw JSON",
    output: "Formatted",
    ph: '{"hello":"world","list":[1,2,3]}',
    format: "Format",
    minify: "Minify",
    sort: "Sort keys",
    copy: "Copy result",
    copied: "Copied",
    clear: "Clear",
    ok: "Valid JSON",
    bytes: "bytes",
    empty: "Paste JSON, then hit Format",
    error: "Parse error",
    back: "Back to hub",
    tool: "JSON Formatter v1.0",
    sample: "Sample",
  },
};

/** 递归按 key 排序，便于比对两份 JSON */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortKeys((value as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return value;
}

const SAMPLE = `{"name":"Navigator Hub","version":3,"features":["搜索","收藏","跨端同步"],"author":{"name":"张柏慈","school":"职高"},"stats":{"sites":62,"ads":0}}`;

export default function JsonFormatterPage() {
  const { locale } = useI18n();
  const l = L[locale] ?? L.zh;
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [sorted, setSorted] = useState(false);

  const stats = useMemo(() => {
    if (!output) return "";
    const bytes = new Blob([output]).size;
    return `${bytes} ${l.bytes}`;
  }, [output, l.bytes]);

  const run = (mode: "format" | "minify", sortOverride?: boolean) => {
    const raw = input.trim();
    if (!raw) {
      setOutput("");
      setError("");
      return;
    }
    const useSort = sortOverride ?? sorted;
    try {
      const parsed = JSON.parse(raw);
      const data = useSort ? sortKeys(parsed) : parsed;
      setOutput(mode === "format" ? JSON.stringify(data, null, 2) : JSON.stringify(data));
      setError("");
    } catch (e) {
      setOutput("");
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const copy = () => {
    if (!output) return;
    navigator.clipboard?.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <div className="cyber-bg min-h-screen">
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <header className="mb-8 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm text-ink-muted transition-all hover:bg-white/10 hover:text-ink"
          >
            <ArrowLeft size={16} /> {l.back}
          </Link>
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <Braces size={14} className="text-brand-primary" />
            {l.tool}
          </div>
        </header>

        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">{l.title}</h1>
          <p className="mt-2 text-sm text-ink-muted">{l.subtitle}</p>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => run("format")}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:-translate-y-0.5"
          >
            <Sparkles size={15} /> {l.format}
          </button>
          <button
            onClick={() => run("minify")}
            className="inline-flex items-center gap-2 rounded-xl border border-stroke bg-bg-elevate px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-white/5"
          >
            <Minimize2 size={15} /> {l.minify}
          </button>
          <button
            onClick={() => {
              const next = !sorted;
              setSorted(next);
              if (input.trim()) run("format", next);
            }}
            className={`inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all ${
              sorted
                ? "border-transparent bg-brand-gradient text-white shadow-glow"
                : "border-stroke bg-bg-elevate text-ink hover:bg-white/5"
            }`}
          >
            <Braces size={15} /> {l.sort}
          </button>
          <button
            onClick={() => setInput(SAMPLE)}
            className="inline-flex items-center gap-2 rounded-xl border border-stroke px-5 py-2.5 text-sm text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
          >
            {l.sample}
          </button>
          <button
            onClick={() => {
              setInput("");
              setOutput("");
              setError("");
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-stroke px-5 py-2.5 text-sm text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
          >
            <Trash2 size={15} /> {l.clear}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-ink">{l.input}</h3>
              <span className="text-[11px] text-ink-subtle">{input.length}</span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={l.ph}
              spellCheck={false}
              className="h-[420px] w-full resize-none rounded-xl border border-stroke bg-bg-elevate px-4 py-3 font-mono text-xs leading-relaxed text-ink outline-none transition-colors focus:border-brand-primary"
            />
          </div>

          <div className="glass-card p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-ink">{l.output}</h3>
              <div className="flex items-center gap-2">
                {stats && !error && <span className="text-[11px] text-ink-subtle">{stats}</span>}
                <button
                  onClick={copy}
                  disabled={!output}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-ink-muted hover:bg-white/10 hover:text-ink disabled:opacity-40"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  {copied ? l.copied : l.copy}
                </button>
              </div>
            </div>

            {error ? (
              <div className="h-[420px] overflow-auto rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                <p className="mb-1 text-xs font-semibold text-red-400">{l.error}</p>
                <p className="break-all font-mono text-[11px] leading-relaxed text-red-300">{error}</p>
              </div>
            ) : (
              <div className="relative">
                <textarea
                  value={output}
                  readOnly
                  placeholder={l.empty}
                  spellCheck={false}
                  className="h-[420px] w-full resize-none rounded-xl border border-stroke bg-bg-elevate px-4 py-3 font-mono text-xs leading-relaxed text-ink outline-none"
                />
                {output && (
                  <span className="pointer-events-none absolute right-3 top-2 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                    {l.ok}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
