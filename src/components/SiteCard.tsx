import { useEffect, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { useUserStore } from "@/stores/useUserStore";
import { logger } from "@/lib/logger";
import { useI18n } from "@/i18n";
import { HealthBadge } from "./HealthAndFreq";
import type { LucideIcon } from "lucide-react";

interface Props {
  id: string;
  name: string;
  url: string;
  desc?: string;
  iconName?: string;
  categoryId: string;
  custom?: boolean;
  index?: number;          // 当前分类中的序号（1..9），用于快捷键
  onDeleteCustom?: () => void;
}

const icon = (n: string): LucideIcon =>
  (Icons as unknown as Record<string, LucideIcon>)[n] ?? Icons.Globe;

export default function SiteCard({ id, name, url, desc, iconName = "Globe", categoryId, custom, index, onDeleteCustom }: Props) {
  const toggleFav = useUserStore((s) => s.toggleFavorite);
  const favorites = useUserStore((s) => s.favorites);
  const recordVisit = useUserStore((s) => s.recordVisit);
  const { t } = useI18n();
  const [iconSrc, setIconSrc] = useState<string | null>(null);
  const [iconError, setIconError] = useState<number>(0);
  const isFav = favorites.includes(id);
  const I = icon(iconName);

  // 图标多级回退：本地public → DuckDuckGo → Google S2 → Cravatar
  useEffect(() => {
    let cancelled = false;
    const candidates: (() => string | null)[] = [
      () => `/icons/${id}.svg`,
      () => `/icons/${id}.png`,
      () => {
        try {
          const host = new URL(url.startsWith("http") ? url : "https://" + url).hostname;
          return `https://api.favicon.im/${host}`;
        } catch { return null; }
      },
      () => {
        try {
          const host = new URL(url.startsWith("http") ? url : "https://" + url).hostname;
          return `https://api.faviconkit.com/${host}/64`;
        } catch { return null; }
      },
      () => {
        try {
          const host = new URL(url.startsWith("http") ? url : "https://" + url).hostname;
          return `https://icons.duckduckgo.com/ip3/${host}.ico`;
        } catch { return null; }
      },
      () => {
        try {
          const host = new URL(url.startsWith("http") ? url : "https://" + url).hostname;
          return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
        } catch { return null; }
      },
      () => {
        try {
          const host = new URL(url.startsWith("http") ? url : "https://" + url).hostname;
          return `https://cravatar.cn/avatar/${host}?s=64&d=identicon`;
        } catch { return null; }
      },
    ];
    const tryNext = (i: number) => {
      if (cancelled || i >= candidates.length) return;
      const src = candidates[i]();
      if (!src) { tryNext(i + 1); return; }
      const img = new Image();
      img.onload = () => { if (!cancelled) setIconSrc(src); };
      img.onerror = () => tryNext(i + 1);
      img.src = src;
    };
    tryNext(iconError);
    return () => { cancelled = true; };
  }, [id, url, iconError]);

  const click = () => {
    logger.info("SiteCard", "打开站点", { id, url });
    recordVisit({ siteId: id, siteName: name, url, categoryId });
    const u = url.startsWith("http") ? url : "https://" + url;
    window.open(u, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-stroke bg-bg-elevate/60 p-4 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-stroke-hover hover:shadow-glow animate-fade-in-up cursor-pointer"
      onClick={click}
      role="link"
    >
      {index && index <= 9 && (
        <div className="absolute left-3 top-3 font-mono text-[10px] font-bold text-white/25 group-hover:text-brand-primary/80">
          {index}
        </div>
      )}
      <span
        role="button" tabIndex={0}
        onClick={(e) => { e.stopPropagation(); toggleFav(id); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); toggleFav(id); } }}
        className={`absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full transition-all ${
          isFav ? "bg-amber-400/15 text-amber-400 shadow-glow scale-100" : "text-ink-subtle opacity-0 group-hover:opacity-100 hover:bg-white/5 hover:text-amber-300"
        }`}
        title={t.fav.addHint}
      >
        {isFav ? <Icons.Star size={15} fill="currentColor" /> : <Icons.Star size={15} />}
      </span>

      {custom && onDeleteCustom && (
        <button
          onClick={(e) => { e.stopPropagation(); if (confirm(t.custom.confirmDel)) onDeleteCustom(); }}
          className="absolute right-10 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-subtle opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
          title={t.custom.del}
        >
          <Icons.Trash2 size={14} />
        </button>
      )}

      <div className="mb-3 flex items-center gap-3">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
          {iconSrc
            ? <img src={iconSrc} alt={name} className="h-7 w-7 rounded-md" onError={() => setIconError((x) => x + 1)} loading="lazy" />
            : <I size={22} className="text-brand-primary" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[15px] font-semibold text-ink">{name}</h3>
            <HealthBadge siteId={id} />
          </div>
          <p className="truncate text-[11px] text-ink-subtle">{url.replace(/^https?:\/\//, "")}</p>
        </div>
      </div>
      <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-ink-muted">{desc || "—"}</p>
      <div className="mt-3 flex items-center justify-between border-t border-stroke/60 pt-2 text-[11px] text-ink-subtle">
        <span className="inline-flex items-center gap-1">
          <Icons.ExternalLink size={12} className="text-brand-primary" /> 直达
        </span>
        {isFav && <Icons.Star size={12} className="text-amber-400" fill="currentColor" />}
      </div>
    </div>
  );
}
