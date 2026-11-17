import { useState } from "react";
import * as Icons from "@/lib/iconRegistry";
import { useI18n } from "@/i18n";

const HIDE_KEY = "nh.introGuideHidden.v1";

/**
 * 首屏「30 秒看懂」引导条
 *   - 一句话说明解决什么问题，三步说明怎么用
 *   - 可关闭，关闭状态记在 localStorage，只对回访用户生效
 */
export default function IntroGuide() {
  const { t } = useI18n();
  const [hidden, setHidden] = useState(() => localStorage.getItem(HIDE_KEY) === "1");

  if (hidden) return null;

  const dismiss = () => {
    localStorage.setItem(HIDE_KEY, "1");
    setHidden(true);
  };

  const steps = [t.intro.step1, t.intro.step2, t.intro.step3];

  return (
    <div className="w-full rounded-2xl border border-stroke bg-bg-elevate/60 p-4 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icons.Sparkles size={16} className="text-cyan-400" />
          <span className="text-sm font-semibold text-ink">{t.intro.title}</span>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-ink-muted transition-colors hover:bg-white/10 hover:text-ink"
        >
          <Icons.X size={13} />
          {t.intro.dismiss}
        </button>
      </div>

      <p className="mt-2 text-[13px] leading-relaxed text-ink">{t.intro.tagline}</p>

      <ol className="mt-3 grid gap-2 sm:grid-cols-3">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2 rounded-xl border border-stroke/50 bg-white/5 px-3 py-2">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-[10px] font-bold text-white">
              {i + 1}
            </span>
            <span className="text-[11px] leading-relaxed text-ink-muted">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
