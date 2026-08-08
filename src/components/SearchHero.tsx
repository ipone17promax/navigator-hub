import { useEffect, useMemo, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { useAppStore } from "@/stores/useAppStore";
import { SEARCH_ENGINES } from "@/config/sites";
import { logger } from "@/lib/logger";
import type { LucideIcon } from "lucide-react";

const icon = (name: string): LucideIcon =>
  (Icons as unknown as Record<string, LucideIcon>)[name] ?? Icons.Search;

/**
 * 英雄搜索框
 * - 支持 4 个搜索引擎切换（带下拉）
 * - 回车跳转、快捷 CMD+K 自动聚焦
 */
export default function SearchHero() {
  const engineId = useAppStore((s) => s.activeEngineId);
  const setEngineId = useAppStore((s) => s.setActiveEngineId);
  const keyword = useAppStore((s) => s.keyword);
  const setKeyword = useAppStore((s) => s.setKeyword);

  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const engines = SEARCH_ENGINES;
  const activeEngine = useMemo(
    () => engines.find((e) => e.id === engineId) ?? engines[0],
    [engines, engineId],
  );

  // 全局快捷键：/ 或 Cmd/Ctrl+K 聚焦
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // 点击外部关闭下拉
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  const doSearch = (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    logger.info("SearchHero", "提交搜索", { keyword: q, engine: activeEngine.id });
    const url = activeEngine.urlTemplate.replace("{query}", encodeURIComponent(q));
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const EngineIcon = icon(activeEngine.iconName);

  return (
    <div className="relative mx-auto w-full max-w-[880px] animate-fade-in-up" style={{ animationDelay: "80ms" }}>
      <div className="relative flex items-stretch gap-0 rounded-2xl border border-stroke bg-bg-elevate/80 backdrop-blur-xl transition-all duration-300 focus-within:border-stroke-hover focus-within:shadow-glow-lg">
        {/* 左：引擎切换器 */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex h-full items-center gap-2 rounded-l-2xl border-r border-stroke px-4 text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
            title="切换搜索引擎"
          >
            <EngineIcon size={20} style={{ color: activeEngine.accent }} />
            <span className="hidden text-sm font-medium sm:inline-block">{activeEngine.name}</span>
            <Icons.ChevronDown
              size={16}
              className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            />
          </button>

          {/* 下拉 */}
          {open && (
            <div className="absolute left-0 top-[calc(100%+10px)] z-40 w-56 overflow-hidden rounded-2xl border border-stroke bg-bg-base/95 p-1.5 shadow-card backdrop-blur-xl animate-fade-in-up">
              {engines.map((e) => {
                const I = icon(e.iconName);
                const active = e.id === engineId;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => {
                      setEngineId(e.id);
                      setOpen(false);
                      inputRef.current?.focus();
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-all duration-200 ${
                      active ? "bg-white/10 text-ink" : "text-ink-muted hover:bg-white/5 hover:text-ink"
                    }`}
                  >
                    <I size={18} style={{ color: e.accent }} />
                    <span className="flex-1 text-sm font-medium">{e.name}</span>
                    {active && <Icons.Check size={16} className="text-brand-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 中：搜索输入 */}
        <div className="relative flex-1">
          <Icons.Search
            size={20}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle"
          />
          <input
            ref={inputRef}
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") doSearch(keyword);
              if (e.key === "Escape") {
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder={`通过 ${activeEngine.name} 搜索全网，按回车开启…（/ 或 ⌘K 聚焦）`}
            className="block h-full w-full bg-transparent px-12 py-4 text-lg text-ink placeholder:text-ink-subtle outline-none"
          />
          {/* 快捷键提示 */}
          <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 text-[11px] text-ink-subtle md:flex">
            <kbd className="rounded-md border border-stroke bg-white/5 px-1.5 py-0.5 font-mono">
              {navigator.platform.toLowerCase().includes("mac") ? "⌘K" : "Ctrl+K"}
            </kbd>
          </div>
        </div>

        {/* 右：搜索按钮 */}
        <button
          type="button"
          onClick={() => doSearch(keyword)}
          className="group m-1.5 flex items-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-lg active:translate-y-0"
        >
          搜索
          <Icons.ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>

      {/* 热门搜索建议词 */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-ink-subtle">热门搜索：</span>
        {["React 18 新特性", "TypeScript 高级类型", "Tailwind 动画", "AI 工作流", "Vite 构建优化"].map((tag, i) => (
          <button
            key={tag}
            onClick={() => {
              setKeyword(tag);
              doSearch(tag);
            }}
            className="rounded-full border border-stroke bg-bg-elevate/50 px-3 py-1 text-xs text-ink-muted transition-all duration-200 hover:border-stroke-hover hover:text-ink"
            style={{ animation: `fadeInUp .6s ${120 + i * 60}ms both` }}
          >
            #{tag}
          </button>
        ))}
      </div>
    </div>
  );
}
