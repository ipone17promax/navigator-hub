import { useState, useCallback, useRef, useEffect } from "react";
import { ArrowLeft, Copy, Trash2, Play, Square, CheckCircle2, Radio, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const MORSE_CODE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.",
  G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..",
  M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
  S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..", "0": "-----", "1": ".----", "2": "..---",
  "3": "...--", "4": "....-", "5": ".....", "6": "-....", "7": "--...",
  "8": "---..", "9": "----.", ".": ".-.-.-", ",": "--..--", "?": "..--..",
  "'": ".----.", "!": "-.-.--", "/": "-..-.", "(": "-.--.", ")": "-.--.-",
  "&": ".-...", ":": "---...", ";": "-.-.-.", "=": "-...-", "+": ".-.-.",
  "-": "-....-", _: "..--.-", '"': ".-..-.", $: "...-..-", "@": ".--.-.",
  " ": "/",
};

const MORSE_REVERSE: Record<string, string> = {};
Object.entries(MORSE_CODE).forEach(([char, code]) => {
  MORSE_REVERSE[code] = char;
});

export default function MorseCodePage() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(15);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ledRef = useRef<HTMLDivElement | null>(null);

  const textToMorse = useCallback((text: string): string => {
    return Array.from(text)
      .map((c) => MORSE_CODE[c.toUpperCase()] || "?")
      .join(" ");
  }, []);

  const morseToText = useCallback((morse: string): string => {
    return morse
      .split(" / ")
      .map((word) =>
        word
          .split(" ")
          .filter(Boolean)
          .map((c) => MORSE_REVERSE[c] || "?")
          .join("")
      )
      .join(" ");
  }, []);

  const convert = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      return;
    }
    const result = mode === "encode" ? textToMorse(input) : morseToText(input);
    setOutput(result);
  }, [input, mode, textToMorse, morseToText]);

  const handleInputChange = (value: string) => {
    setInput(value);
    if (value.trim()) {
      const result = mode === "encode" ? textToMorse(value) : morseToText(value);
      setOutput(result);
    } else {
      setOutput("");
    }
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
    stopPlayback();
  };

  const flashLed = (duration: number) => {
    if (ledRef.current) {
      ledRef.current.style.background = "linear-gradient(90deg, #00ffff, #ff00ff)";
      ledRef.current.style.boxShadow = "0 0 20px #00ffff";
      setTimeout(() => {
        if (ledRef.current) {
          ledRef.current.style.background = "rgba(0,255,0,0.1)";
          ledRef.current.style.boxShadow = "none";
        }
      }, duration);
    }
  };

  const playTone = (frequency: number, duration: number) => {
    if (!audioContextRef.current) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      audioContextRef.current = new Ctor();
    }
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const playMorse = async () => {
    if (!output.trim()) return;
    setIsPlaying(true);
    const dotDuration = (60000 / (wpm * 50));
    const dashDuration = dotDuration * 3;
    const gapDuration = dotDuration;

    try {
      for (const char of output) {
        if (!isPlayingRef.current) break;

        if (char === ".") {
          playTone(850, dotDuration);
          flashLed(dotDuration);
          await new Promise((r) => setTimeout(r, dotDuration + gapDuration));
        } else if (char === "-") {
          playTone(650, dashDuration);
          flashLed(dashDuration);
          await new Promise((r) => setTimeout(r, dashDuration + gapDuration));
        } else if (char === " ") {
          await new Promise((r) => setTimeout(r, dotDuration * 3));
        } else if (char === "/") {
          await new Promise((r) => setTimeout(r, dotDuration * 7));
        }
      }
    } finally {
      setIsPlaying(false);
    }
  };

  const isPlayingRef = useRef(false);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const stopPlayback = () => {
    setIsPlaying(false);
  };

  const switchMode = () => {
    setMode(mode === "encode" ? "decode" : "encode");
    setInput("");
    setOutput("");
  };

  const referenceChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

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
            <Radio size={14} className="text-brand" />
            摩斯电码机 v1.0
          </div>
        </header>

        {/* 标题 */}
        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">摩斯电码机</h1>
          <p className="mt-2 text-sm text-ink-muted">文字 ↔ 摩斯电码 · 音频播放 · 可视化信号</p>
        </div>

        {/* 模式切换 */}
        <div className="mb-6 flex items-center justify-center">
          <button
            onClick={switchMode}
            className="rounded-xl bg-brand-gradient px-6 py-3 font-display text-sm font-semibold text-white shadow-glow transition-all hover:-translate-y-0.5 hover:shadow-glow-lg"
          >
            切换模式（{mode === "encode" ? "文字→摩斯" : "摩斯→文字"}）
          </button>
        </div>

        {/* 信号指示灯 */}
        <div
          ref={ledRef}
          className="mx-auto mb-6 h-4 max-w-md rounded-full bg-white/10 transition-all"
        />

        {/* 输入输出 */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card p-5">
            <h3 className="mb-3 font-display text-sm font-semibold text-ink">
              {mode === "encode" ? "输入文字" : "输入摩斯码"}
            </h3>
            <textarea
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={mode === "encode" ? "如 HELLO WORLD" : "如 .... . .-.. .-.. --- / .-- --- .-. .-.. -.."}
              className="h-36 w-full resize-none rounded-xl border border-stroke bg-black/40 px-4 py-3 font-mono text-sm text-ink outline-none focus:border-brand/50"
              spellCheck={false}
            />
          </div>

          <div className="glass-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-ink">
                {mode === "encode" ? "输出摩斯码" : "输出文字"}
              </h3>
              <button
                onClick={copyOutput}
                disabled={!output}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-ink-muted hover:bg-white/10 hover:text-ink disabled:opacity-50"
              >
                {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? "已复制" : "复制"}
              </button>
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="转换结果..."
              className="h-36 w-full resize-none rounded-xl border border-stroke bg-black/40 px-4 py-3 font-mono text-sm text-ink outline-none"
              spellCheck={false}
            />
          </div>
        </div>

        {/* 控制面板 */}
        <div className="mt-6 glass-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-3">
              <span className="font-display text-sm text-ink">播放速度 (WPM):</span>
              <input
                type="range"
                min="5"
                max="30"
                value={wpm}
                onChange={(e) => setWpm(parseInt(e.target.value))}
                className="w-32 accent-brand"
              />
              <span className="font-display text-sm font-bold text-brand">{wpm}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={convert}
              className="rounded-xl bg-brand-gradient px-5 py-2.5 font-display text-sm font-semibold text-white shadow-glow transition-all hover:-translate-y-0.5"
            >
              转换
            </button>
            <button
              onClick={playMorse}
              disabled={!output || isPlaying}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 px-5 py-2.5 font-display text-sm font-semibold text-emerald-400 transition-all hover:bg-emerald-500/30 disabled:opacity-50"
            >
              <Play size={16} />
              {isPlaying ? "播放中..." : "播放"}
            </button>
            <button
              onClick={stopPlayback}
              disabled={!isPlaying}
              className="inline-flex items-center gap-2 rounded-xl bg-red-500/20 px-5 py-2.5 font-display text-sm font-semibold text-red-400 transition-all hover:bg-red-500/30 disabled:opacity-50"
            >
              <Square size={16} />
              停止
            </button>
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-2 rounded-xl border border-stroke bg-white/5 px-5 py-2.5 font-display text-sm font-semibold text-ink-muted hover:bg-white/10 hover:text-ink"
            >
              <Trash2 size={16} />
              清空
            </button>
          </div>
        </div>

        {/* 摩斯码参考表 */}
        <div className="mt-6 glass-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Zap size={16} className="text-brand" />
            <h3 className="font-display text-sm font-semibold text-ink">摩斯码对照表</h3>
          </div>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
            {Array.from(referenceChars).map((char) => (
              <div
                key={char}
                className="rounded-lg border border-stroke bg-white/5 p-2 text-center transition-all hover:border-brand/50 hover:bg-white/10"
              >
                <div className="font-display text-sm font-bold text-ink">{char}</div>
                <div className="font-mono text-xs text-brand">{MORSE_CODE[char]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}