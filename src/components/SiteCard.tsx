import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as Icons from "@/lib/iconRegistry";
import { useUserStore } from "@/stores/useUserStore";
import { logger } from "@/lib/logger";
import { useI18n } from "@/i18n";
import { HealthBadge } from "./HealthAndFreq";
import { LOCAL_ICON_IDS } from "@/config/localIcons";
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
  const { t, locale } = useI18n();
  const [iconSrc, setIconSrc] = useState<string | null>(null);
  const [iconError, setIconError] = useState<number>(0);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const longPressTimer = useRef<number | null>(null);
  const longPressFired = useRef(false);
  const pressOrigin = useRef({ x: 0, y: 0 });
  const isFav = favorites.includes(id);
  const I = icon(iconName);
  const zh = locale === "zh";

  // 图标多级回退：本地图标（需在 localIcons 登记）→ 国内源优先 → 站点 favicon.ico → 国外源兜底
  useEffect(() => {
    let cancelled = false;
    const hasLocalIcon = LOCAL_ICON_IDS.includes(id);
    const candidates: (() => string | null)[] = [];
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

  const clearPressTimer = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // 触屏/鼠标长按（520ms）呼出快捷菜单；移动超过 10px 视为滚动，取消长按
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    longPressFired.current = false;
    pressOrigin.current = { x: e.clientX, y: e.clientY };
    clearPressTimer();
    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true;
      navigator.vibrate?.(12);
      const w = 172;
      const h = 132;
      setMenu({
        x: Math.min(Math.max(8, e.clientX), window.innerWidth - w - 8),
        y: Math.min(Math.max(8, e.clientY + 8), window.innerHeight - h - 8),
      });
    }, 520);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!longPressTimer.current) return;
    const dx = e.clientX - pressOrigin.current.x;
    const dy = e.clientY - pressOrigin.current.y;
    if (Math.hypot(dx, dy) > 10) clearPressTimer();
  };

  const guardedClick = () => {
    // 长按已呼出菜单时，不要顺带打开站点
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    click();
  };

  useEffect(() => {
    if (!menu) return;
    const close = () => {
      // 菜单关闭后恢复普通点击，避免下一次单击被误吞
      longPressFired.current = false;
      setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("pointerdown", close);
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("scroll", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const menuItems = menu ? [
    {
      key: "open",
      icon: Icons.ExternalLink,
      label: zh ? "打开站点" : "Open site",
      run: () => { click(); setMenu(null); },
    },
    {
      key: "fav",
      icon: Icons.Star,
      label: isFav ? (zh ? "取消收藏" : "Unfavorite") : (zh ? "加入收藏" : "Add to favorites"),
      run: () => { toggleFav(id); setMenu(null); },
    },
    {
      key: "copy",
      icon: Icons.Copy,
      label: copied ? (zh ? "已复制" : "Copied") : (zh ? "复制链接" : "Copy link"),
      run: () => {
        navigator.clipboard?.writeText(url.startsWith("http") ? url : "https://" + url);
        setCopied(true);
        window.setTimeout(() => { setCopied(false); setMenu(null); }, 700);
      },
    },
  ] : [];

  return (
    <div
      className="site-card group relative flex flex-col overflow-hidden rounded-2xl border border-stroke bg-bg-elevate/60 p-4 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-stroke-hover hover:shadow-glow animate-fade-in-up cursor-pointer"
      onClick={guardedClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={clearPressTimer}
      onPointerCancel={clearPressTimer}
      onPointerLeave={clearPressTimer}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); click(); } }}
      role="link"
      tabIndex={0}
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

      {/* 长按快捷菜单：portal 到 body，避免被卡片 overflow-hidden 裁掉 */}
      {menu && createPortal(
        <div
          className="fixed inset-0 z-[130]"
          onPointerDown={() => setMenu(null)}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="absolute w-[172px] overflow-hidden rounded-xl border border-stroke bg-bg-base/95 p-1 shadow-card backdrop-blur-xl animate-fade-in"
            style={{ left: menu.x, top: menu.y }}
            onPointerDown={(e) => e.stopPropagation()}
            role="menu"
          >
            <div className="truncate px-2.5 py-1.5 text-[10px] font-semibold text-ink-subtle">{name}</div>
            {menuItems.map((it) => (
              <button
                key={it.key}
                role="menuitem"
                onClick={it.run}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
              >
                <it.icon size={13} className="text-brand-primary" />
                {it.label}
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
