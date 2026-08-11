import { useEffect, useMemo, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { useAppStore } from "@/stores/useAppStore";
import { SITES, CATEGORIES, SEARCH_ENGINES } from "@/config/sites";
import { useUserStore } from "@/stores/useUserStore";
import { useI18n } from "@/i18n";
import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

const catIconMap: Record<string, string> = {
  all: "LayoutGrid", search: "Search", dev: "Code2", ai: "Bot",
  design: "Palette", social: "MessageCircle", video: "Video",
  learn: "BookOpen", office: "Briefcase", weather: "CloudSun", tools: "Wrench",
};

const icon = (n: string): LucideIcon => (Icons as unknown as Record<string, LucideIcon>)[n] ?? Icons.Globe;

interface Item {
  id: string;
  group: string;
  title: string;
  desc?: string;
  icon: LucideIcon;
  color?: string;
  onRun: () => void;
}

export default function CommandPalette() {
  const open = useAppStore((s) => s.commandPaletteOpen);
  const close = useAppStore((s) => s.closeCommandPalette);
  const setCategory = useAppStore((s) => s.setActiveCategoryId);
  const setEngine = useAppStore((s) => s.setActiveEngineId);
  const customCats = useUserStore((s) => s.customCats);
  const customSites = useUserStore((s) => s.customSites);
  const visits = useUserStore((s) => s.visits);
  const toggleFav = useUserStore((s) => s.toggleFavorite);
  const { t, toggle, toggleTheme, accent, setAccent, setTheme, locale } = useI18n();
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ(""); setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    setIdx(0);
  }, [q]);

  const builtInSites = useMemo<any[]>(() => {
    const all: any[] = SITES.map((s) => ({ ...s, categoryId: s.category as string, desc: s.description, builtIn: true }));
    customSites.forEach((s) => all.push({
      id: s.id, name: s.name, url: s.url, desc: s.desc || "", iconName: s.icon || "Globe", categoryId: s.categoryId as string, builtIn: false,
    }));
    return all;
  }, [customSites]);

  const items = useMemo<Item[]>(() => {
    const low = q.trim().toLowerCase();
    const allCats = [
      ...CATEGORIES.map((c) => ({ id: c.key, name: t.cats[c.key as keyof typeof t.cats] ?? c.label, iconName: catIconMap[c.key] || "Folder" })),
      ...customCats.map((c) => ({ id: c.id, name: c.name, iconName: c.iconName })),
    ];
    const sites: Item[] = builtInSites
      .filter((s) => !low || s.name.toLowerCase().includes(low) || s.url.toLowerCase().includes(low) || (s.desc || "").toLowerCase().includes(low))
      .map((s) => ({
        id: "site_" + s.id,
        group: t.cmd.groups.sites,
        title: s.name,
        desc: s.url,
        icon: icon(s.iconName),
        color: "#22d3ee",
        onRun: () => {
          window.open(s.url.startsWith("http") ? s.url : "https://" + s.url, "_blank", "noopener,noreferrer");
          useUserStore.getState().recordVisit({ siteId: s.id, siteName: s.name, url: s.url, categoryId: s.categoryId });
        },
      }));

    const cats: Item[] = allCats
      .filter((c) => !low || c.name.toLowerCase().includes(low))
      .map((c) => ({
        id: "cat_" + c.id,
        group: t.cmd.groups.cats,
        title: c.name,
        icon: icon(c.iconName),
        color: "#a78bfa",
        onRun: () => setCategory(c.id),
      }));

    const actions: Item[] = [
      { id: "a_lang", group: t.cmd.groups.actions, title: locale === "zh" ? "Switch to English" : "切换到中文", icon: Icons.Languages, color: "#f472b6", onRun: toggle },
      { id: "a_theme", group: t.cmd.groups.actions, title: t.theme.title, icon: Icons.Palette, color: "#fb923c", onRun: toggleTheme },
      { id: "a_clearstats", group: t.cmd.groups.actions, title: t.stats.clear, icon: Icons.Trash2, color: "#ef4444", onRun: () => useUserStore.getState().clearStats() },
      { id: "a_layout", group: t.cmd.groups.actions, title: t.layout.switch, icon: Icons.LayoutGrid, color: "#34d399", onRun: () => {
        const s = useUserStore.getState();
        s.setLayout(s.layout === "comfy" ? "compact" : s.layout === "compact" ? "large" : "comfy");
      }},
      { id: "a_search", group: t.cmd.groups.actions, title: t.engineSwitch, icon: Icons.Search, color: "#60a5fa", onRun: () => {
        const cur = useAppStore.getState().activeEngineId;
        const list = SEARCH_ENGINES.map((e) => e.id);
        const nxt = list[(list.indexOf(cur) + 1) % list.length];
        setEngine(nxt);
      }},
      { id: "a_newtab", group: t.cmd.groups.actions, title: t.newtab.title, icon: Icons.ExternalLink, color: "#22d3ee", onRun: () => window.open(location.href, "_blank") },
      { id: "a_accent_cyan",   group: t.cmd.groups.actions, title: t.theme.cyan,   icon: Icons.Droplet, color: "#22d3ee", onRun: () => setAccent("cyan") },
      { id: "a_accent_purple", group: t.cmd.groups.actions, title: t.theme.purple, icon: Icons.Droplet, color: "#a78bfa", onRun: () => setAccent("purple") },
      { id: "a_accent_pink",   group: t.cmd.groups.actions, title: t.theme.pink,   icon: Icons.Droplet, color: "#f472b6", onRun: () => setAccent("pink") },
      { id: "a_accent_orange", group: t.cmd.groups.actions, title: t.theme.orange, icon: Icons.Droplet, color: "#fb923c", onRun: () => setAccent("orange") },
      { id: "a_accent_green",  group: t.cmd.groups.actions, title: t.theme.green,  icon: Icons.Droplet, color: "#34d399", onRun: () => setAccent("green") },
      { id: "a_accent_mono",   group: t.cmd.groups.actions, title: t.theme.mono,   icon: Icons.Droplet, color: "#94a3b8", onRun: () => setAccent("mono") },
    ].filter((x) => !low || x.title.toLowerCase().includes(low));

    const tools: Item[] = [
      { id: "t_storm",   group: t.cmd.groups.tools, title: t.nav.storm,   icon: Icons.CloudLightning, color: "#22d3ee", onRun: () => nav("/storm-tracker") },
      { id: "t_binary",  group: t.cmd.groups.tools, title: t.nav.binary,  icon: Icons.Binary,         color: "#a78bfa", onRun: () => nav("/binary-parser") },
      { id: "t_morse",   group: t.cmd.groups.tools, title: t.nav.morse,   icon: Icons.Radio,          color: "#f472b6", onRun: () => nav("/morse-code") },
      { id: "t_compass", group: t.cmd.groups.tools, title: t.nav.clock,   icon: Icons.Compass,        color: "#fb923c", onRun: () => nav("/compass-clock") },
      { id: "t_home",    group: t.cmd.groups.tools, title: t.nav.home,    icon: Icons.Home,           color: "#34d399", onRun: () => nav("/") },
    ].filter((x) => !low || x.title.toLowerCase().includes(low));

    return [...sites.slice(0, 20), ...cats, ...actions, ...tools];
  }, [q, builtInSites, customCats, toggle, toggleTheme, setAccent, setCategory, setEngine, nav, visits, t, accent]);

  const grouped = useMemo(() => {
    const g: Record<string, Item[]> = {};
    items.forEach((it) => {
      g[it.group] = g[it.group] || [];
      g[it.group].push(it);
    });
    return g;
  }, [items]);

  const flatList = useMemo(() => items, [items]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, flatList.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter")     { e.preventDefault(); flatList[idx]?.onRun(); close(); }
    if (e.key === "Escape")    { close(); }
  };

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, close]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 pt-[12vh] backdrop-blur-sm animate-fade-in"
      onClick={close}>
      <div
        className="w-[min(92vw,640px)] overflow-hidden rounded-2xl border border-stroke bg-bg-base/95 shadow-2xl backdrop-blur-xl animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-stroke px-4 py-3">
          <Icons.Search size={18} className="text-ink-subtle" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder={t.cmd.placeholder}
            className="flex-1 bg-transparent text-[15px] text-ink placeholder:text-ink-subtle outline-none"
          />
          <kbd className="hidden rounded-md border border-stroke bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-ink-subtle md:block">Esc</kbd>
        </div>
        <div className="max-h-[52vh] overflow-y-auto p-2">
          {flatList.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-ink-muted">{t.cmd.empty}</div>
          ) : (
            Object.entries(grouped).map(([group, list]) => (
              <div key={group} className="mb-2">
                <div className="px-3 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-widest text-ink-subtle">{group}</div>
                {list.map((it) => {
                  const i = flatList.indexOf(it);
                  const active = i === idx;
                  const Icon = it.icon;
                  return (
                    <button
                      key={it.id}
                      onClick={() => { it.onRun(); close(); }}
                      onMouseEnter={() => setIdx(i)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                        active ? "bg-white/10 text-ink" : "text-ink-muted hover:bg-white/5 hover:text-ink"
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                        <Icon size={16} style={{ color: it.color }} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="truncate text-sm font-medium">{it.title}</div>
                        {it.desc && <div className="truncate text-[11px] text-ink-subtle">{it.desc}</div>}
                      </div>
                      {active && <kbd className="rounded-md border border-stroke bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-ink-subtle">Enter</kbd>}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="flex items-center justify-between border-t border-stroke px-4 py-2 text-[11px] text-ink-subtle">
          <span>↑↓ Enter · {t.cmd.hint}</span>
          <span>© Navigator Hub v3</span>
        </div>
      </div>
    </div>
  );
}
