import { useState, useCallback } from "react";
import { ArrowLeft, Copy, Trash2, Repeat, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * 二进制解析器页面：文字 ↔ 二进制 双向转换
 */
export default function BinaryParserPage() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const textToBinary = useCallback((text: string): string => {
    try {
      const bytes = new TextEncoder().encode(text);
      return Array.from(bytes)
        .map((b) => b.toString(2).padStart(8, "0"))
        .join(" ");
    } catch {
      return "编码错误";
    }
  }, []);

  const binaryToText = useCallback((binary: string): string => {
    try {
      const clean = binary.replace(/\s+/g, "");
      if (!/^[01]+$/.test(clean)) return "⚠️ 无效二进制输入";
      const bytes: number[] = [];
      for (let i = 0; i < clean.length; i += 8) {
        const chunk = clean.slice(i, i + 8);
        if (chunk.length === 8) bytes.push(parseInt(chunk, 2));
      }
      return new TextDecoder().decode(new Uint8Array(bytes));
    } catch {
      return "⚠️ 解码失败";
    }
  }, []);

  const convert = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      return;
    }
    const result = mode === "encode" ? textToBinary(input) : binaryToText(input);
    setOutput(result);
  }, [input, mode, textToBinary, binaryToText]);

  const handleInputChange = (value: string) => {
    setInput(value);
    if (value.trim()) {
      const result = mode === "encode" ? textToBinary(value) : binaryToText(value);
      setOutput(result);
    } else {
      setOutput("");
    }
  };

  const switchMode = () => {
    const newMode = mode === "encode" ? "decode" : "encode";
    setMode(newMode);
    setInput("");
    setOutput("");
  };

  const copyOutput = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 剪贴板权限被拒绝，忽略 */
    }
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
  };

  const charCount = input.length;
  const binaryLength = output.replace(/\s+/g, "").length;

  return (
    <div className="cyber-bg min-h-screen">
      <div className="container mx-auto max-w-5xl px-4 py-6">
        {/* 顶栏 */}
        <header className="mb-8 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm text-ink-muted transition-all hover:bg-white/10 hover:text-ink"
          >
            <ArrowLeft size={16} /> 返回导航中心
          </Link>
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            二进制解析器 v1.0
          </div>
        </header>

        {/* 标题 */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            二进制解析器
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            文字 ↔ 二进制 双向转换 · 支持全语言 Unicode
          </p>
        </div>

        {/* 模式切换 */}
        <div className="mb-6 flex items-center justify-center gap-4">
          <button
            onClick={switchMode}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-6 py-3 font-display text-sm font-semibold text-white shadow-glow transition-all hover:-translate-y-0.5 hover:shadow-glow-lg"
          >
            <Repeat size={18} />
            切换模式（{mode === "encode" ? "文字→二进制" : "二进制→文字"}）
          </button>
        </div>

        {/* 输入输出 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 输入 */}
          <div className="glass-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-ink">
                {mode === "encode" ? "输入文字" : "输入二进制"}
              </h3>
              <span className="text-xs text-ink-muted">{charCount} 字符</span>
            </div>
            <textarea
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={mode === "encode" ? "在此输入文字内容..." : "在此输入二进制数据（如 01000001 01000010）..."}
              className="h-48 w-full resize-none rounded-xl border border-stroke bg-black/40 px-4 py-3 font-mono text-sm text-ink outline-none transition-all focus:border-brand/50 focus:shadow-glow"
              spellCheck={false}
            />
          </div>

          {/* 输出 */}
          <div className="glass-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-ink">
                {mode === "encode" ? "输出二进制" : "输出文字"}
              </h3>
              <div className="flex items-center gap-3">
                {output && (
                  <span className="text-xs text-ink-muted">
                    {mode === "encode" ? `${binaryLength} 位` : `${output.length} 字符`}
                  </span>
                )}
                <button
                  onClick={copyOutput}
                  disabled={!output}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-ink-muted transition-colors hover:bg-white/10 hover:text-ink disabled:opacity-50"
                >
                  {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {copied ? "已复制" : "复制"}
                </button>
              </div>
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="转换结果将显示在这里..."
              className="h-48 w-full resize-none rounded-xl border border-stroke bg-black/40 px-4 py-3 font-mono text-sm text-ink outline-none"
              spellCheck={false}
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={convert}
            className="rounded-xl bg-brand-gradient px-6 py-3 font-display text-sm font-semibold text-white shadow-glow transition-all hover:-translate-y-0.5 hover:shadow-glow-lg"
          >
            转换
          </button>
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-2 rounded-xl border border-stroke bg-white/5 px-6 py-3 font-display text-sm font-semibold text-ink-muted transition-all hover:bg-white/10 hover:text-ink"
          >
            <Trash2 size={16} />
            清空
          </button>
        </div>

        {/* 使用说明 */}
        <div className="mt-8 rounded-xl border border-stroke bg-white/5 p-5 text-sm text-ink-muted">
          <h4 className="mb-2 font-display font-semibold text-ink">使用说明</h4>
          <ul className="list-inside list-disc space-y-1">
            <li>编码模式：输入文字，自动转换为二进制（UTF-8 编码）</li>
            <li>解码模式：输入二进制（空格分隔或连续），还原为原始文字</li>
            <li>支持中文、英文、特殊符号等所有 Unicode 字符</li>
            <li>在输入框中输入时会实时转换</li>
          </ul>
        </div>
      </div>
    </div>
  );
}