import { Github, Heart, Sparkles } from "lucide-react";

/**
 * 页面底部品牌栏
 */
export default function AppFooter() {
  return (
    <footer className="w-full pt-8 pb-6 text-center text-xs text-ink-subtle animate-fade-in-up" style={{ animationDelay: "320ms" }}>
      <div className="container flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-2 text-ink-muted">
          <span className="font-display font-semibold tracking-wide text-ink">NavigatorHub</span>
          <Sparkles size={14} className="text-brand-primary" />
          <span>v1.0.0 · 赛博未来主义网址导航中心</span>
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
      </div>
    </footer>
  );
}
