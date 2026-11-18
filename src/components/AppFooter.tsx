import { Github, Heart, Sparkles } from "lucide-react";
import { useI18n } from "@/i18n";

/**
 * 页面底部品牌栏
 */
export default function AppFooter() {
  const { t } = useI18n();
  return (
    <footer className="w-full pt-8 pb-24 text-center text-xs text-ink-subtle animate-fade-in-up" style={{ animationDelay: "320ms" }}>
      <div className="container flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-2 text-ink-muted">
          <span className="font-display font-semibold tracking-wide text-ink">NavigatorHub</span>
          <Sparkles size={14} className="text-brand-primary" />
          <span>v1.0.0 · {t.footerTagline}</span>
        </div>
        <div className="flex items-center gap-3 opacity-80">
          <span className="inline-flex items-center gap-1">
            Made with <Heart size={12} className="text-rose-400 fill-rose-400/50" /> using React + Vite + Tailwind
          </span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-brand-primary"
          >
            <Github size={14} />
            GitHub
          </a>
        </div>
        <div className="mt-2 max-w-2xl space-y-1 border-t border-stroke/40 px-4 pt-2 text-[11px] leading-relaxed text-ink-subtle/80">
          <p>{t.legal.copyright}</p>
          <p>{t.legal.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
