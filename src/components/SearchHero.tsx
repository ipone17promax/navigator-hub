import { useEffect, useMemo, useRef, useState } from "react";
import * as Icons from "@/lib/iconRegistry";
import { useAppStore } from "@/stores/useAppStore";
import { SEARCH_ENGINES } from "@/config/sites";
import { logger } from "@/lib/logger";
import { useI18n } from "@/i18n";
import { useUserStore } from "@/stores/useUserStore";
import { searchSites, categoryLabel, openSiteTarget, type SiteHit } from "@/lib/siteSearch";
import type { LucideIcon } from "lucide-react";

/** 高亮命中片段（仅字面命中；拼音命中时按原名展示） */
function highlightText(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-brand-primary/25 px-0.5 text-brand-primary">
        {text.slice(i, i + q.length)}
      </mark>
      {text.slice(i + q.length)}
    </>
  );
}

const icon = (name: string): LucideIcon =>
  (Icons as unknown as Record<string, LucideIcon>)[name] ?? Icons.Search;

const HISTORY_KEY = "nh.search.history";
const HISTORY_MAX = 8;

/** bang 语法：!前缀 + 空格 + 关键词，绕过当前引擎直连指定站点 */
const BANGS: Record<string, { name: string; template: string }> = {
  g: { name: "Google", template: "https://www.google.com/search?q={query}" },
  gh: { name: "GitHub", template: "https://github.com/search?q={query}" },
  npm: { name: "npm", template: "https://www.npmjs.com/search?q={query}" },
  so: { name: "Stack Overflow", template: "https://stackoverflow.com/search?q={query}" },
  bd: { name: "百度", template: "https://www.baidu.com/s?wd={query}" },
  bing: { name: "Bing", template: "https://www.bing.com/search?q={query}" },
  zh: { name: "知乎", template: "https://www.zhihu.com/search?type=content&q={query}" },
  yt: { name: "YouTube", template: "https://www.youtube.com/results?search_query={query}" },
  bili: { name: "B站", template: "https://search.bilibili.com/all?keyword={query}" },
  wiki: { name: "Wikipedia", template: "https://zh.wikipedia.org/wiki/Special:Search?search={query}" },
  mdn: { name: "MDN", template: "https://developer.mozilla.org/zh-CN/search?q={query}" },
};

/** 判断输入是否像一个网址（含协议，或裸域名 + 可选路径） */
function looksLikeUrl(s: string) {
  if (/\s/.test(s)) return false;
  if (/^https?:\/\//i.test(s)) return true;
  return /^[\w-]+(\.[\w-]+)+(\/[^\s]*)?(\?[^\s]*)?(#\S*)?$/i.test(s);
}

function normalizeUrl(s: string) {
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

type Resolved =
  | { kind: "url"; url: string; label: string }
  | { kind: "bang"; url: string; label: string; rest: string }
  | { kind: "search"; url: string; label: string };

function loadHistory(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string").slice(0, HISTORY_MAX) : [];
  } catch {
    return [];
  }
}

export default function SearchHero() {
  const engineId = useAppStore((s) => s.activeEngineId);
  const setEngineId = useAppStore((s) => s.setActiveEngineId);
  const keyword = useAppStore((s) => s.keyword);
  const setKeyword = useAppStore((s) => s.setKeyword);
  const { t } = useI18n();

  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [history, setHistory] = useState<string[]>(loadHistory);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const engines = SEARCH_ENGINES;
  const activeEngine = useMemo(
    () => engines.find((e) => e.id === engineId) ?? engines[0],
    [engines, engineId],
  );

  /** 解析输入：网址直达 / !bang 指定引擎 / 当前引擎搜索 */
  const resolved = useMemo<Resolved | null>(() => {
    const q = keyword.trim();
    if (!q) return null;
    const bang = /^!([a-zA-Z]+)\s+([\s\S]+)$/.exec(q);
    if (bang) {
      const key = bang[1].toLowerCase();
      const preset = BANGS[key];
      if (preset) {
        const rest = bang[2].trim();
        return {
          kind: "bang",
          url: preset.template.replace("{query}", encodeURIComponent(rest)),
          label: preset.name,
          rest,
        };
      }
    }
    if (looksLikeUrl(q)) return { kind: "url", url: normalizeUrl(q), label: q };
    return {
      kind: "search",
      url: activeEngine.urlTemplate.replace("{query}", encodeURIComponent(q)),
      label: activeEngine.name,
    };
  }, [keyword, activeEngine]);

  /** 本地站点建议：bang 与网址输入时不打扰 */
  const siteHits = useMemo<SiteHit[]>(() => {
    const q = keyword.trim();
    if (!q || /^!/.test(q) || looksLikeUrl(q)) return [];
    return searchSites(q, 6);
  }, [keyword]);

  const openSite = (site: SiteHit) => {
    useUserStore.getState().recordVisit({
      siteId: site.id,
      siteName: site.name,
      url: site.url,
      categoryId: site.category,
    });
    logger.info("SearchHero", "open-local-site", { site: site.id });
    openSiteTarget(site.url);
  };

  /** bang 补全：输入 ! 后给出可用前缀 */
  const bangSuggest = useMemo(() => {
    const q = keyword.trim();
    if (!q.startsWith("!") || q.includes(" ")) return [];
    const p = q.slice(1).toLowerCase();
    return Object.entries(BANGS)
      .filter(([k]) => p === "" || k.startsWith(p))
      .slice(0, 8);
  }, [keyword]);

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

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  const pushHistory = (entry: string) => {
    const next = [entry, ...history.filter((h) => h !== entry)].slice(0, HISTORY_MAX);
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      /* 隐私模式下写不进去，忽略 */
    }
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* ignore */
    }
  };

  const doSearch = (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    const bang = /^!([a-zA-Z]+)\s+([\s\S]+)$/.exec(q);
    const preset = bang ? BANGS[bang[1].toLowerCase()] : undefined;
    let url: string;
    let loggedQuery = q;
    if (preset && bang) {
      loggedQuery = bang[2].trim();
      url = preset.template.replace("{query}", encodeURIComponent(loggedQuery));
      pushHistory(q);
    } else if (looksLikeUrl(q)) {
      url = normalizeUrl(q);
      pushHistory(q);
    } else {
      url = activeEngine.urlTemplate.replace("{query}", encodeURIComponent(q));
      pushHistory(q);
    }
    logger.info("SearchHero", "submit", {
      keyword: loggedQuery,
      engine: preset ? preset.name : activeEngine.id,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const EngineIcon = icon(activeEngine.iconName);
  const showHistory = focused && !keyword.trim() && history.length > 0;

  return (
    <div className="relative mx-auto w-full max-w-[880px] animate-fade-in-up" style={{ animationDelay: "80ms" }}>
      <div className="relative flex items-stretch gap-0 rounded-2xl border border-stroke bg-bg-elevate/80 backdrop-blur-xl transition-all duration-300 focus-within:border-stroke-hover focus-within:shadow-glow-lg">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex h-full items-center gap-2 rounded-l-2xl border-r border-stroke px-4 text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
            title={t.engineSwitch}
            aria-label={t.engineSwitch}
            aria-expanded={open}
          >
            <EngineIcon size={20} style={{ color: activeEngine.accent }} />
            <span className="hidden text-sm font-medium sm:inline-block">{activeEngine.name}</span>
            <Icons.ChevronDown
              size={16}
              className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            />
          </button>

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

        <div className="relative flex-1">
          <Icons.Search
            size={20}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle"
          />
          <input
            ref={inputRef}
            type="search"
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setActiveIdx(-1); }}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 120)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" && siteHits.length > 0) {
                e.preventDefault();
                setActiveIdx((i) => Math.min(siteHits.length - 1, i + 1));
                return;
              }
              if (e.key === "ArrowUp" && siteHits.length > 0) {
                e.preventDefault();
                setActiveIdx((i) => Math.max(-1, i - 1));
                return;
              }
              if (e.key === "Enter") {
                if (activeIdx >= 0 && siteHits[activeIdx]) openSite(siteHits[activeIdx]);
                else doSearch(keyword);
                return;
              }
              if (e.key === "Escape") {
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchPlaceholder}
            className="block h-full w-full bg-transparent px-12 py-4 text-lg text-ink placeholder:text-ink-subtle outline-none"
          />
          <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 text-[11px] text-ink-subtle md:flex">
            <kbd className="rounded-md border border-stroke bg-white/5 px-1.5 py-0.5 font-mono">
              {navigator.platform.toLowerCase().includes("mac") ? "Cmd+K" : "Ctrl+K"}
            </kbd>
          </div>
        </div>

        <button
          type="button"
          onClick={() => doSearch(keyword)}
          className="group m-1.5 flex items-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-white shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-lg active:translate-y-0"
        >
          {t.searchBtn}
          <Icons.ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>

        {/* 本地站点建议：↑↓ 选择，Enter 打开；不改变「直接回车走搜索」的默认行为 */}
        {focused && siteHits.length > 0 && (
          <div
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-stroke bg-bg-base/95 p-1.5 shadow-card backdrop-blur-xl animate-fade-in-up"
            role="listbox"
            aria-label={t.search.localResults}
          >
            {siteHits.map((site, i) => {
              const I = icon(site.iconName);
              return (
                <button
                  key={site.id}
                  type="button"
                  role="option"
                  aria-selected={i === activeIdx}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => openSite(site)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                    i === activeIdx ? "bg-white/10 text-ink" : "text-ink-muted hover:bg-white/5 hover:text-ink"
                  }`}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5"
                    style={{ color: site.accent }}
                  >
                    <I size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{highlightText(site.name, keyword)}</span>
                    <span className="block truncate text-[11px] text-ink-subtle">{highlightText(site.description, keyword)}</span>
                  </span>
                  <span className="shrink-0 rounded-full border border-stroke px-2 py-0.5 text-[10px] text-ink-subtle">
                    {categoryLabel(site.category)}
                  </span>
                </button>
              );
            })}
            <div className="px-3 pb-0.5 pt-1 text-[10px] text-ink-subtle">{t.search.localHint}</div>
          </div>
        )}
      </div>

      {/* 实时解析提示：让「按回车会发生什么」一目了然 */}
      {resolved && (
        <div className="mt-2 flex items-center justify-center gap-2 text-[11px] text-ink-subtle animate-fade-in">
          {resolved.kind === "url" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-stroke bg-bg-elevate/60 px-2.5 py-1">
              <Icons.ExternalLink size={12} className="text-brand-primary" />
              {t.search.urlHint}
            </span>
          )}
          {resolved.kind === "bang" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-stroke bg-bg-elevate/60 px-2.5 py-1">
              <Icons.Command size={12} className="text-brand-primary" />
              {t.search.bangHint} · {resolved.label}
            </span>
          )}
          {resolved.kind === "search" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-stroke bg-bg-elevate/60 px-2.5 py-1">
              <EngineIcon size={12} style={{ color: activeEngine.accent }} />
              {resolved.label}
            </span>
          )}
        </div>
      )}

      {/* bang 补全：点击自动补全前缀与空格 */}
      {focused && bangSuggest.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 animate-fade-in">
          {bangSuggest.map(([key, b]) => (
            <button
              key={key}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setKeyword("!" + key + " ");
                inputRef.current?.focus();
              }}
              className="rounded-full border border-stroke bg-bg-elevate/50 px-3 py-1 text-xs text-ink-muted transition-colors hover:border-stroke-hover hover:text-ink"
            >
              <span className="font-mono">!{key}</span> · {b.name}
            </button>
          ))}
        </div>
      )}

      {showHistory ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 animate-fade-in">
          <span className="text-xs text-ink-subtle">{t.search.history}</span>
          {history.map((h) => (
            <button
              key={h}
              type="button"
              // 阻止默认 mousedown 抢焦点，避免下拉还没点就因 blur 消失
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setKeyword(h);
                doSearch(h);
              }}
              className="max-w-[220px] truncate rounded-full border border-stroke bg-bg-elevate/50 px-3 py-1 text-xs text-ink-muted transition-all duration-200 hover:border-stroke-hover hover:text-ink"
              title={h}
            >
              {h}
            </button>
          ))}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clearHistory}
            className="rounded-full px-2 py-1 text-xs text-ink-subtle transition-colors hover:text-ink"
          >
            {t.search.clear}
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-ink-subtle">{t.hotSearch}</span>
          {["React 18", "TypeScript", "Tailwind", "AI", "Vite"].map((tag, i) => (
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
      )}
    </div>
  );
}
