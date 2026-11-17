import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Copy, Download, ImageDown, QrCode as QrIcon, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import qrcode from "qrcode-generator";
import { useI18n } from "@/i18n";

type Ecc = "L" | "M" | "Q" | "H";

const L = {
  zh: {
    title: "二维码工坊",
    subtitle: "纯本地生成 · 不上传任何内容 · 支持下载 PNG / SVG",
    input: "内容（网址或任意文本）",
    ph: "https://example.com 或任意一段文字",
    ecc: "容错级别",
    size: "尺寸",
    preview: "预览",
    empty: "输入内容后自动生成",
    downloadPng: "下载 PNG",
    downloadSvg: "下载 SVG",
    copy: "复制内容",
    copied: "已复制",
    clear: "清空",
    tooLong: "内容过长，无法生成二维码（上限约 2900 字符）",
    hint: "容错越高越耐污损，但可容纳的字符越少。网址建议用 M。",
    chars: "字符数",
    back: "返回导航中心",
    sample: "填入示例",
    tool: "二维码工坊 v1.0",
  },
  en: {
    title: "QR Workshop",
    subtitle: "Generated locally — nothing is uploaded. Export PNG / SVG.",
    input: "Content (URL or any text)",
    ph: "https://example.com or any text",
    ecc: "Error correction",
    size: "Size",
    preview: "Preview",
    empty: "Type something to generate",
    downloadPng: "Download PNG",
    downloadSvg: "Download SVG",
    copy: "Copy text",
    copied: "Copied",
    clear: "Clear",
    tooLong: "Content too long for a QR code (max ~2900 chars)",
    hint: "Higher error correction survives more damage but holds fewer characters. M is a good default.",
    chars: "chars",
    back: "Back to hub",
    sample: "Insert sample",
    tool: "QR Workshop v1.0",
  },
};

export default function QrCodePage() {
  const { locale } = useI18n();
  const l = L[locale] ?? L.zh;
  const [text, setText] = useState("");
  const [ecc, setEcc] = useState<Ecc>("M");
  const [cell, setCell] = useState(6);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const svg = useMemo(() => {
    const value = text.trim();
    if (!value) return "";
    try {
      const q = qrcode(0, ecc);
      q.addData(value);
      q.make();
      return q.createSvgTag({ cellSize: cell, margin: 3, scalable: true });
    } catch {
      return "__ERR__";
    }
  }, [text, ecc, cell]);

  useEffect(() => {
    setErr(svg === "__ERR__" ? l.tooLong : "");
  }, [svg, l.tooLong]);

  const filename = () => `qr-${Date.now()}`;

  const downloadSvg = () => {
    if (!svg || svg === "__ERR__") return;
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${filename()}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadPng = () => {
    if (!svg || svg === "__ERR__") return;
    const size = 1024;
    const img = new Image();
    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `${filename()}.png`;
      a.click();
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  };

  const copy = () => {
    if (!text.trim()) return;
    navigator.clipboard?.writeText(text.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  const ok = Boolean(svg) && svg !== "__ERR__";

  return (
    <div className="cyber-bg min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <header className="mb-8 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm text-ink-muted transition-all hover:bg-white/10 hover:text-ink"
          >
            <ArrowLeft size={16} /> {l.back}
          </Link>
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <QrIcon size={14} className="text-brand-primary" />
            {l.tool}
          </div>
        </header>

        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">{l.title}</h1>
          <p className="mt-2 text-sm text-ink-muted">{l.subtitle}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-ink">{l.input}</h3>
              <span className="text-[11px] text-ink-subtle">
                {text.length} {l.chars}
              </span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={l.ph}
              spellCheck={false}
              className="h-40 w-full resize-none rounded-xl border border-stroke bg-bg-elevate px-4 py-3 font-mono text-sm text-ink outline-none transition-colors focus:border-brand-primary"
            />

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-[11px] text-ink-subtle">{l.ecc}</label>
                <div className="flex gap-1">
                  {(["L", "M", "Q", "H"] as Ecc[]).map((k) => (
                    <button
                      key={k}
                      onClick={() => setEcc(k)}
                      className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-all ${
                        ecc === k
                          ? "border-transparent bg-brand-gradient text-white shadow-glow"
                          : "border-stroke text-ink-muted hover:bg-white/5"
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-ink-subtle">
                  {l.size} · {cell}
                </label>
                <input
                  type="range"
                  min={2}
                  max={12}
                  value={cell}
                  onChange={(e) => setCell(Number(e.target.value))}
                  className="w-full accent-brand-primary"
                />
              </div>
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-ink-subtle">{l.hint}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={downloadPng}
                disabled={!ok}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-glow transition-all hover:-translate-y-0.5 disabled:opacity-40"
              >
                <ImageDown size={15} /> {l.downloadPng}
              </button>
              <button
                onClick={downloadSvg}
                disabled={!ok}
                className="inline-flex items-center gap-2 rounded-xl border border-stroke bg-bg-elevate px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-white/5 disabled:opacity-40"
              >
                <Download size={15} /> {l.downloadSvg}
              </button>
              <button
                onClick={copy}
                disabled={!text.trim()}
                className="inline-flex items-center gap-2 rounded-xl border border-stroke px-4 py-2 text-sm text-ink-muted transition-colors hover:bg-white/5 hover:text-ink disabled:opacity-40"
              >
                {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                {copied ? l.copied : l.copy}
              </button>
              <button
                onClick={() => setText("")}
                disabled={!text}
                className="inline-flex items-center gap-2 rounded-xl border border-stroke px-4 py-2 text-sm text-ink-muted transition-colors hover:bg-white/5 hover:text-ink disabled:opacity-40"
              >
                <RefreshCw size={15} /> {l.clear}
              </button>
            </div>
          </div>

          <div className="glass-card flex flex-col p-5">
            <h3 className="mb-3 font-display text-sm font-semibold text-ink">{l.preview}</h3>
            {err ? (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 text-center text-xs text-amber-500">
                {err}
              </div>
            ) : ok ? (
              <div
                ref={previewRef}
                className="mx-auto w-full max-w-[320px] rounded-xl bg-white p-3 [&_svg]:h-auto [&_svg]:w-full"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-stroke p-6 text-center text-xs text-ink-subtle">
                {l.empty}
              </div>
            )}
            <p className="mt-3 text-center text-[11px] text-ink-subtle">{l.subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
