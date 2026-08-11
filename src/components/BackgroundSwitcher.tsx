import { useRef } from "react";
import * as Icons from "lucide-react";
import { useI18n } from "@/i18n";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { LucideIcon } from "lucide-react";

const PRESETS: { id: string; cls: string; key: keyof ReturnType<typeof useI18n>["t"]["bg"]; icon: LucideIcon }[] = [
  { id: "starfield", cls: "bg-starfield", key: "starfield", icon: Icons.Sparkles },
  { id: "aurora",    cls: "bg-aurora",    key: "aurora",    icon: Icons.Waves },
  { id: "deepsea",   cls: "bg-deepsea",   key: "deepsea",   icon: Icons.Anchor },
  { id: "sunset",    cls: "bg-sunset",    key: "sunset",    icon: Icons.Sunset },
  { id: "neon",      cls: "bg-neon",      key: "neon",      icon: Icons.Zap },
  { id: "cyber",     cls: "bg-cyber",     key: "cyber",     icon: Icons.Terminal },
  { id: "minimal",   cls: "bg-minimal",   key: "minimal",   icon: Icons.Moon },
  { id: "sakura",    cls: "bg-sakura",    key: "sakura",    icon: Icons.Flower2 },
  { id: "warm",      cls: "bg-warm",      key: "warm",      icon: Icons.Sun },
  { id: "matrix",    cls: "bg-matrix",    key: "matrix",    icon: Icons.Hash },
];

const WALLPAPER_LIB: { id: string; thumb: string; url: string }[] = [
  { id: "w-stars",  thumb: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#312e81 100%)", url: "" },
  { id: "w-nebula", thumb: "linear-gradient(135deg,#4c1d95 0%,#be185d 50%,#f97316 100%)", url: "" },
  { id: "w-ocean",  thumb: "linear-gradient(135deg,#042f2e 0%,#0e7490 50%,#06b6d4 100%)", url: "" },
  { id: "w-sunset", thumb: "linear-gradient(135deg,#7c2d12 0%,#e11d48 50%,#f59e0b 100%)", url: "" },
  { id: "w-forest", thumb: "linear-gradient(135deg,#052e16 0%,#14532d 50%,#65a30d 100%)", url: "" },
  { id: "w-candy",  thumb: "linear-gradient(135deg,#fbcfe8 0%,#c4b5fd 50%,#bae6fd 100%)", url: "" },
  { id: "w-mono",   thumb: "linear-gradient(135deg,#020617 0%,#1e293b 50%,#334155 100%)", url: "" },
  { id: "w-dawn",   thumb: "linear-gradient(135deg,#fb7185 0%,#f472b6 40%,#a78bfa 100%)", url: "" },
];

export default function BackgroundSwitcher() {
  const { t } = useI18n();
  const preset = useSettingsStore((s) => s.preset);
  const setPreset = useSettingsStore((s) => s.setPreset);
  const opacity = useSettingsStore((s) => s.opacity);
  const setOpacity = useSettingsStore((s) => s.setOpacity);
  const customImage = useSettingsStore((s) => s.customImage);
  const setCustomImage = useSettingsStore((s) => s.setCustomImage);
  const fileRef = useRef<HTMLInputElement>(null);

  const apply = (id: string) => {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPreset(id);
    const layer = document.getElementById("app-bg-layer");
    if (layer) {
      layer.className = "fixed inset-0 -z-10 animate-fade-in " + p.cls;
      layer.style.backgroundImage = "";
    }
  };

  const onUpload = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCustomImage(dataUrl);
      const layer = document.getElementById("app-bg-layer");
      if (layer) {
        layer.className = "fixed inset-0 -z-10 animate-fade-in";
        layer.style.backgroundImage = `url(${dataUrl})`;
        layer.style.backgroundSize = "cover";
        layer.style.backgroundPosition = "center";
      }
    };
    reader.readAsDataURL(f);
  };

  const applyWallpaper = (w: { thumb: string; url: string }) => {
    const layer = document.getElementById("app-bg-layer");
    if (!layer) return;
    layer.className = "fixed inset-0 -z-10 animate-fade-in";
    if (w.url) {
      layer.style.backgroundImage = `url(${w.url})`;
      layer.style.backgroundSize = "cover";
      layer.style.backgroundPosition = "center";
    } else {
      layer.style.backgroundImage = w.thumb;
    }
    setPreset("__lib__");
    setCustomImage(w.url || w.thumb);
  };

  const reset = () => {
    setPreset("starfield");
    setCustomImage("");
    const layer = document.getElementById("app-bg-layer");
    if (layer) {
      layer.className = "fixed inset-0 -z-10 animate-fade-in bg-starfield";
      layer.style.backgroundImage = "";
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold text-ink-subtle uppercase tracking-widest">{t.bg.presets}</p>
        <div className="grid grid-cols-5 gap-2">
          {PRESETS.map((p) => {
            const Icon = p.icon ?? Icons.Sparkles;
            const active = preset === p.id && !customImage;
            return (
              <button
                key={p.id}
                onClick={() => apply(p.id)}
                className={`group relative aspect-square overflow-hidden rounded-xl border transition-all ${
                  active ? "border-brand-primary shadow-glow" : "border-stroke hover:border-stroke-hover"
                }`}
                title={t.bg[p.key]}
              >
                <div className={`absolute inset-0 ${p.cls}`} />
                <div className="relative flex h-full flex-col items-center justify-center gap-1 backdrop-blur-[2px]">
                  <Icon size={18} className="text-white drop-shadow" />
                  <span className="text-[10px] font-medium text-white drop-shadow">{t.bg[p.key]}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-ink-subtle uppercase tracking-widest">{t.bg.library}</p>
        <div className="grid grid-cols-4 gap-2">
          {WALLPAPER_LIB.map((w) => (
            <button
              key={w.id}
              onClick={() => applyWallpaper(w)}
              className="aspect-video overflow-hidden rounded-lg border border-stroke transition-all hover:scale-[1.03] hover:border-brand-primary"
              style={{ background: w.thumb }}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-ink-subtle uppercase tracking-widest">{t.bg.custom}</p>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
          <button onClick={() => fileRef.current?.click()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-stroke bg-white/[0.02] py-2.5 text-sm text-ink-muted transition-all hover:border-stroke-hover hover:text-ink">
            <Icons.Upload size={16} /> {t.bg.upload}
          </button>
          <button onClick={reset}
            className="flex items-center gap-1.5 rounded-xl border border-stroke px-3 py-2.5 text-sm text-ink-muted transition-colors hover:bg-white/5 hover:text-ink">
            <Icons.RotateCcw size={14} /> {t.bg.reset}
          </button>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-ink-subtle uppercase tracking-widest">{t.bg.opacity}</p>
          <span className="text-xs text-ink-muted">{Math.round(opacity * 100)}%</span>
        </div>
        <input type="range" min={0.2} max={1} step={0.05} value={opacity}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            setOpacity(v);
            const layer = document.getElementById("app-bg-layer");
            if (layer) layer.style.opacity = String(v);
          }}
          className="w-full accent-cyan-400" />
      </div>
    </div>
  );
}
