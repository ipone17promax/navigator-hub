import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import type { SiteItem } from "@/shared/types";
import type { LucideIcon } from "lucide-react";
import { useUserStore } from "@/stores/useUserStore";

const icon = (name: string): LucideIcon =>
  (Icons as unknown as Record<string, LucideIcon>)[name] ?? Icons.Globe;

interface Props {
  site: SiteItem;
  index: number;
}

/** 从 URL 提取域名，用于获取 favicon */
function getDomain(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://example.com${url}`);
    return u.hostname;
  } catch {
    return "";
  }
}

/** 主站域名（去掉 www. 和子域名） */
function getRootDomain(hostname: string): string {
  const parts = hostname.split(".");
  if (parts.length >= 2) {
    return parts.slice(-2).join(".");
  }
  return hostname;
}

/**
 * 用户自定义 favicon（优先级最高）：
 *   把自己的站点图标保存到  src/assets/favicons/  目录下
 *   文件名 = 下面列表中任意一个，支持 .ico / .png / .jpg / .jpeg / .svg / .webp
 *   例如： github.png  baidu.ico  bilibili.webp  deepseek.com.png  …
 *   匹配规则（任一命中即可）：
 *     1) 文件名 = sites.ts 中站点 id（如  d-github  → d-github.png）
 *     2) 文件名 = 站点主域名（如  github.com   → github.com.png）
 *     3) 文件名 = 主域名不带后缀（如  github     → github.png）
 *   构建时会自动导入并覆盖到对应卡片，无需改本文件代码。
 * 如果没放自定义图标，会回退到 DuckDuckGo 在线 API，再失败则显示 lucide 图标，永不空白。
 */
const userFaviconsMap: Record<string, string> = import.meta.glob(
  "/src/assets/favicons/*.{ico,png,jpg,jpeg,svg,webp,ICO,PNG,JPG,JPEG,SVG,WEBP}",
  { eager: true, import: "default", query: "?url" },
) as unknown as Record<string, string>;

const SUPPORTED_EXT = /\.(ico|png|jpe?g|svg|webp)$/i;

const faviconFileToBase: Record<string, string> = {};
for (const [filePath] of Object.entries(userFaviconsMap)) {
  const base = filePath.split(/[\\/]/).pop()?.replace(SUPPORTED_EXT, "");
  if (base) faviconFileToBase[base.toLowerCase()] = filePath;
}

function resolveCustomFavicon(siteId: string, rootDomain: string): string | null {
  const candidates = [
    siteId.toLowerCase(),
    rootDomain.toLowerCase(),
    rootDomain.replace(/\.[^.]+$/, "").toLowerCase(),
  ];
  for (const c of candidates) {
    const filePath = faviconFileToBase[c];
    if (filePath) return userFaviconsMap[filePath] as string;
  }
  return null;
}

/**
 * 多源 favicon 服务列表（按优先级尝试，任一成功即停止）
 * 1. 用户本地自定义图标（最高优先级）
 * 2. DuckDuckGo（全球通用，国内偶尔抽风）
 * 3. Google s2（速度快，国内多数地区可用）
 * 4. cravatar（国内镜像，缓存友好）
 * 5. icon.horse（装饰性强，备用）
 */
const FAVICON_SERVICES = [
  {
    name: "duckduckgo",
    build: (d: string) => `https://icons.duckduckgo.com/ip3/${d}.ico`,
  },
  {
    name: "google",
    build: (d: string) => `https://www.google.com/s2/favicons?domain=${d}&sz=64`,
  },
  {
    name: "cravatar",
    build: (d: string) => `https://cravatar.cn/favicon/${d}?default=`,
  },
  {
    name: "iconhorse",
    build: (d: string) => `https://icon.horse/icon/${d}`,
  },
];

// 缓存已验证可用的源，避免每张卡反复重试
const workingSourceCache = new Map<string, number>();

/**
 * 单张网站卡片：玻璃拟态 + 悬停发光 + 站点 favicon
 */
export default function SiteCard({ site, index }: Props) {
  const Icon = icon(site.iconName);
  const navigate = useNavigate();
  const delay = `${260 + index * 35}ms`;

  const { favorites, toggleFavorite, recordVisit } = useUserStore();
  const isFav = favorites.includes(site.id);

  const isInternal = useMemo(
    () => site.url.startsWith("/") && !/^https?:\/\//i.test(site.url),
    [site.url],
  );

  const domain = useMemo(() => getDomain(site.url), [site.url]);
  const rootDomain = useMemo(() => (domain ? getRootDomain(domain) : ""), [domain]);

  // 用户自定义图标（最高优先级）
  const customFavicon = useMemo(
    () => (!isInternal ? resolveCustomFavicon(site.id, rootDomain) : null),
    [site.id, rootDomain, isInternal],
  );

  // 外链 favicon 源列表
  const externalSources = useMemo(() => {
    if (isInternal || customFavicon || !rootDomain) return [];
    return FAVICON_SERVICES.map((s) => s.build(rootDomain));
  }, [isInternal, customFavicon, rootDomain]);

  // 初始源索引：如果缓存里有这个域名上次成功的源，从它开始
  const [sourceIndex, setSourceIndex] = useState(() => {
    if (!rootDomain) return 0;
    return workingSourceCache.get(rootDomain) ?? 0;
  });
  const [imgLoaded, setImgLoaded] = useState(false);

  // 当 rootDomain 变化时（分类切换），重置状态
  const prevDomainRef = useMemo(() => ({ value: rootDomain }), []);
  if (prevDomainRef.value !== rootDomain) {
    prevDomainRef.value = rootDomain;
    setSourceIndex(workingSourceCache.get(rootDomain) ?? 0);
    setImgLoaded(false);
  }

  // 最终图片源
  const imageSrc = useMemo(() => {
    if (customFavicon) return customFavicon;
    if (externalSources.length === 0) return "";
    if (sourceIndex >= externalSources.length) return "";
    return externalSources[sourceIndex];
  }, [customFavicon, externalSources, sourceIndex]);

  const showImage = !isInternal && !!imageSrc;

  const openExternal = () => {
    recordVisit(site.id);
    window.open(site.url, "_blank", "noopener,noreferrer");
  };

  const onContext = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      navigator.clipboard?.writeText(site.url);
    } catch {
      /* noop */
    }
  };

  // 图片加载失败：尝试下一个源
  const handleFaviconError = () => {
    if (customFavicon) return;
    setImgLoaded(false);
    setSourceIndex((prev) => prev + 1);
  };

  // 图片加载成功：记下这个源，下次直接用
  const handleFaviconLoad = () => {
    setImgLoaded(true);
    if (rootDomain && !customFavicon) {
      workingSourceCache.set(rootDomain, sourceIndex);
    }
  };

  const CardInner = (
    <>
      {/* 左上渐变色条 */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-8 w-8 overflow-hidden rounded-tl-2xl"
        style={{
          background: `linear-gradient(135deg, ${site.accent}, transparent 70%)`,
          opacity: 0.65,
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute left-2 top-2 h-1.5 w-1.5 rounded-full transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: site.accent, opacity: 0.85, boxShadow: `0 0 12px ${site.accent}` }}
      />

      {/* 图标/站点 logo 容器 */}
      <div className="relative mb-4 mt-1 flex items-center justify-center">
        <div
          className="absolute inset-0 mx-auto my-0 h-14 w-14 rounded-2xl opacity-35 blur-xl transition-opacity duration-500 group-hover:opacity-80"
          style={{ background: `radial-gradient(closest-side, ${site.accent}, transparent)` }}
        />
        <div
          className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-stroke bg-bg-elevate/70 backdrop-blur transition-all duration-300 group-hover:scale-110"
          style={{
            boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${site.accent} 35%, transparent)`,
          }}
        >
          {showImage ? (
            <>
              {/* 加载中占位：用 lucide 图标垫底，图片加载完成后淡出显示 */}
              {!imgLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon
                    size={24}
                    strokeWidth={1.75}
                    style={{
                      color: site.accent,
                      opacity: 0.4,
                      filter: `drop-shadow(0 0 8px color-mix(in srgb, ${site.accent} 40%, transparent))`,
                    }}
                  />
                </div>
              )}
              <img
                src={imageSrc}
                alt={site.name}
                className={`h-8 w-8 rounded-lg object-contain transition-opacity duration-300 ${
                  imgLoaded ? "opacity-100" : "opacity-0"
                }`}
                style={{ filter: "drop-shadow(0 0 4px rgba(0,0,0,0.3))" }}
                onError={handleFaviconError}
                onLoad={handleFaviconLoad}
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            </>
          ) : (
            <Icon
              size={24}
              strokeWidth={1.75}
              style={{
                color: site.accent,
                filter: `drop-shadow(0 0 8px color-mix(in srgb, ${site.accent} 60%, transparent))`,
              }}
            />
          )}
        </div>
      </div>

      {/* 文字区 */}
      <div className="flex-1 text-center">
        <h3 className="font-display text-[15px] font-semibold leading-tight text-ink transition-colors duration-200 group-hover:text-brand-gradient">
          {site.name}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-muted">
          {site.description}
        </p>
      </div>

      {/* 右下角信息 */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-ink-subtle transition-all duration-300 group-hover:text-ink-muted">
        <span className="max-w-[70%] truncate font-mono tracking-tight opacity-70 transition-opacity group-hover:opacity-100">
          {isInternal ? `站内 · ${site.url}` : domain.replace(/^www\./, "")}
        </span>
        {isInternal ? (
          <Icons.ChevronRight
            size={14}
            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-brand-primary"
          />
        ) : (
          <Icons.ExternalLink
            size={14}
            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-primary"
          />
        )}
      </div>

      {/* 收藏按钮（用 span 避免在外链 <button> 内套 button，触发 DOM 嵌套警告）*/}
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFavorite(site.id);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(site.id);
          }
        }}
        className="absolute right-2 top-2 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-bg-base/60 backdrop-blur-sm transition-all hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        title={isFav ? "取消收藏" : "收藏"}
        aria-label={isFav ? "取消收藏" : "收藏"}
      >
        {isFav ? (
          <Icons.Star
            size={15}
            className="fill-amber-400 text-amber-400"
            style={{ filter: "drop-shadow(0 0 4px rgba(251,191,36,0.5))" }}
          />
        ) : (
          <Icons.Star
            size={15}
            className="text-ink-subtle opacity-0 transition-opacity duration-200 group-hover:opacity-60 hover:!opacity-100"
          />
        )}
      </span>
    </>
  );

  if (isInternal) {
    return (
      <Link
        to={site.url}
        onClick={(e) => {
          const isPlain =
            !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && e.button === 0;
          if (isPlain) {
            e.preventDefault();
            recordVisit(site.id);
            void navigate(site.url);
          }
        }}
        onContextMenu={onContext}
        className="group relative glass-card card-shimmer flex h-full w-full flex-col items-stretch p-4 text-left animate-fade-in-up focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60"
        style={{ animationDelay: delay }}
        title={`${site.name} · 点击打开（站内路由），右键复制链接`}
      >
        {CardInner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={openExternal}
      onContextMenu={onContext}
      className="group relative glass-card card-shimmer flex h-full w-full flex-col items-stretch p-4 text-left animate-fade-in-up focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60"
      style={{ animationDelay: delay }}
      title={`${site.name} · 点击打开新标签页，右键复制链接${customFavicon ? " · 自定义图标" : ""}`}
    >
      {CardInner}
    </button>
  );
}
