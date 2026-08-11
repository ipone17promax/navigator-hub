import { useRef, useState } from "react";
import * as Icons from "lucide-react";
import { useUserStore, BG_PRESETS, type BgKey } from "@/stores/useUserStore";
import { useI18n } from "@/i18n";

const PRESET_KEYS: BgKey[] = ["stars", "aurora", "ocean", "sunset", "forest", "abstract"];

export default function BackgroundSwitcher() {
  const { t } = useI18n();
  const { bgConfig, setBgKey, setBgCustomUrl, setBgOpacity, resetBg } = useUserStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setBgCustomUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title={t.bgTitle}
        className="flex items-center gap-1.5 rounded-lg border border-stroke bg-bg-elevate/60 px-2.5 py-1.5 text-xs text-ink-muted transition-all hover:border-stroke-hover hover:text-ink"
      >
        <Icons.Image size={14} />
        <span className="hidden sm:inline">{t.bgTitle}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-stroke bg-bg-base/95 p-4 backdrop-blur-xl shadow-2xl animate-fade-in-up">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">{t.bgTitle}</span>
              <button
                onClick={() => { resetBg(); }}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-ink-subtle transition-colors hover:text-red-400"
              >
                <Icons.RotateCcw size={11} />
                {t.bgReset}
              </button>
            </div>

            <div className="mb-3">
              <p className="mb-2 text-[11px] text-ink-subtle">{t.bgPresetTitle}</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setBgKey("default")}
                  className={`group relative h-14 rounded-lg border-2 transition-all ${
                    bgConfig.key === "default"
                      ? "border-brand-primary shadow-glow"
                      : "border-stroke hover:border-stroke-hover"
                  }`}
                  style={{ background: "var(--bg-base)" }}
                  title={t.bgDefault}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] text-ink-muted">
                    {t.bgDefault}
                  </span>
                </button>
                {PRESET_KEYS.map((key) => (
                  <button
                    key={key}
                    onClick={() => setBgKey(key)}
                    className={`group relative h-14 rounded-lg border-2 transition-all ${
                      bgConfig.key === key
                        ? "border-brand-primary shadow-glow"
                        : "border-stroke hover:border-stroke-hover"
                    }`}
                    style={{
                      background: BG_PRESETS[key as Exclude<BgKey, "default" | "custom">],
                      backgroundSize: "cover",
                    }}
                    title={t.bgPresets[key as keyof typeof t.bgPresets]}
                  >
                    <span className="absolute inset-0 flex items-end justify-center rounded-lg bg-gradient-to-t from-black/60 to-transparent pb-1">
                      <span className="text-[9px] font-medium text-white/90">
                        {t.bgPresets[key as keyof typeof t.bgPresets]}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                className={`flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-stroke px-3 py-2.5 text-xs transition-all hover:border-stroke-hover ${
                  bgConfig.key === "custom" ? "text-brand-primary" : "text-ink-muted"
                }`}
              >
                <Icons.Upload size={14} />
                {t.bgUpload}
              </button>
            </div>

            {bgConfig.key !== "default" && (
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[11px] text-ink-muted">
                  <span>{t.bgOpacity}</span>
                  <span className="font-mono text-ink">
                    {Math.round((bgConfig.opacity || 0.5) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={bgConfig.opacity || 0.5}
                  onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
                  className="w-full accent-brand-primary"
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
