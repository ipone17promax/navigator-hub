import { useState, useEffect, useMemo, useRef } from "react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAppStore } from "@/stores/useAppStore";

interface TabConfig {
  key: string;
  label: string;
  icon: string;
  accent: string;
  searchUrl: string;
  domain: string;
  preview: "iframe" | "popup";
}

const TABS: TabConfig[] = [
  {
    key: "web",
    label: "网页",
    icon: "Globe",
    accent: "#6366F1",
    searchUrl: "https://www.baidu.com/s?wd={q}",
    domain: "baidu.com",
    preview: "popup",
  },
  {
    key: "image",
    label: "图片",
    icon: "Image",
    accent: "#10B981",
    searchUrl: "https://image.baidu.com/search/index?tn=baiduimage&word={q}",
    domain: "image.baidu.com",
    preview: "iframe",
  },
  {
    key: "video",
    label: "视频",
    icon: "PlayCircle",
    accent: "#F87171",
    searchUrl: "https://search.bilibili.com/all?keyword={q}",
    domain: "bilibili.com",
    preview: "iframe",
  },
  {
    key: "news",
    label: "资讯",
    icon: "Newspaper",
    accent: "#FBBF24",
    searchUrl: "https://news.baidu.com/ns?word={q}",
    domain: "news.baidu.com",
    preview: "iframe",
  },
  {
    key: "map",
    label: "地图",
    icon: "MapPin",
    accent: "#60A5FA",
    searchUrl: "https://map.baidu.com/search/{q}",
    domain: "map.baidu.com",
    preview: "iframe",
  },
  {
    key: "scholar",
    label: "学术",
    icon: "GraduationCap",
    accent: "#8B5CF6",
    searchUrl: "https://xueshu.baidu.com/s?wd={q}",
    domain: "xueshu.baidu.com",
    preview: "popup",
  },
];

function getIcon(name: string): LucideIcon {
  return (Icons as unknown as Record<string, LucideIcon>)[name] ?? Icons.Globe;
}

export default function SearchTabs() {
  const keyword = useAppStore((s) => s.keyword);
  const [active, setActive] = useState<string>("web");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [iframeUrl, setIframeUrl] = useState("");

  const activeTab = useMemo(
    () => TABS.find((t) => t.key === active) ?? TABS[0],
    [active],
  );

  const searchUrl = useMemo(() => {
    const q = keyword.trim();
    if (!q) return "";
    return activeTab.searchUrl.replace("{q}", encodeURIComponent(q));
  }, [activeTab, keyword]);

  useEffect(() => {
    if (activeTab.preview === "iframe" && searchUrl) {
      setIframeLoading(true);
      setIframeUrl(searchUrl);
    }
  }, [active, searchUrl, activeTab.preview]);

  const goExternal = (urlTemplate: string) => {
    const q = keyword.trim();
    if (!q) return;
    window.open(urlTemplate.replace("{q}", encodeURIComponent(q)), "_blank", "noopener,noreferrer");
  };

  const onTabClick = (tab: TabConfig) => {
    if (tab.preview === "popup") {
      goExternal(tab.searchUrl);
    } else {
      setActive(tab.key);
    }
  };

  const ActiveIcon = getIcon(activeTab.icon);

  return (
    <div className="w-full max-w-[1200px]">
      {/* 标签栏 */}
      <div className="mb-3 flex flex-wrap items-center gap-1">
        {TABS.map((tab) => {
          const TabIcon = getIcon(tab.icon);
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabClick(tab)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-brand-gradient text-white shadow-glow"
                  : "text-ink-muted hover:bg-white/5 hover:text-ink"
              }`}
              style={
                isActive
                  ? { boxShadow: `0 0 16px 2px ${tab.accent}55` }
                  : undefined
              }
            >
              <TabIcon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 搜索结果预览区 */}
      {activeTab.preview === "iframe" && keyword.trim() ? (
        <div className="relative overflow-hidden rounded-2xl border border-stroke bg-bg-elevate/40 backdrop-blur-xl">
          {/* 地址栏 */}
          <div className="flex items-center gap-2 border-b border-stroke/50 px-4 py-2">
            <div className="flex items-center gap-1.5 text-xs text-ink-subtle">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: activeTab.accent }}
              />
              {activeTab.domain}
            </div>
            <div className="ml-2 flex-1 truncate font-mono text-[11px] text-ink-muted">
              {searchUrl}
            </div>
            <button
              onClick={() => goExternal(activeTab.searchUrl)}
              className="rounded-md border border-stroke px-2 py-0.5 text-[11px] text-ink-muted transition-colors hover:border-stroke-hover hover:text-ink"
            >
              新标签打开
            </button>
          </div>

          {/* iframe 加载状态 */}
          {iframeLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-bg-base/80 backdrop-blur-sm">
              <Icons.Loader2
                size={32}
                className="animate-spin"
                style={{ color: activeTab.accent }}
              />
              <span className="mt-3 text-sm text-ink-muted">
                正在加载「{activeTab.label}」搜索结果…
              </span>
              <span className="mt-1 text-[11px] text-ink-subtle">
                关键词: "{keyword}"
              </span>
            </div>
          )}

          {/* iframe 内容 */}
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            onLoad={() => setIframeLoading(false)}
            className="block h-[600px] w-full"
            title={`${activeTab.label}搜索结果`}
            sandbox="allow-forms allow-scripts allow-popups allow-popups-to-escape-sandbox"
          />

          {/* 提示条 */}
          <div className="border-t border-stroke/50 bg-bg-elevate/60 px-4 py-1.5 text-[11px] text-ink-subtle">
            ⓘ 内嵌预览可能受网站 X-Frame-Options 限制，点击「新标签打开」可查看完整结果
          </div>
        </div>
      ) : activeTab.preview === "popup" && keyword.trim() ? (
        <div className="rounded-2xl border border-stroke bg-bg-elevate/40 p-6 text-center backdrop-blur-xl">
          <div className="flex flex-col items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: `${activeTab.accent}22` }}
            >
              <ActiveIcon size={24} style={{ color: activeTab.accent }} />
            </div>
            <div>
              <div className="text-sm font-medium text-ink">
                即将打开{activeTab.label}搜索
              </div>
              <div className="mt-1 text-xs text-ink-subtle">
                关键词 "{keyword}" 将在新标签页中打开
              </div>
            </div>
            <button
              onClick={() => goExternal(activeTab.searchUrl)}
              className="mt-2 rounded-xl bg-brand-gradient px-5 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-glow-lg"
            >
              前往{activeTab.label}搜索
              <Icons.ArrowRight size={14} className="ml-1 inline" />
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-stroke/60 bg-bg-elevate/20 p-8 text-center backdrop-blur-xl">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: `${activeTab.accent}15` }}
          >
            <ActiveIcon size={32} style={{ color: activeTab.accent }} />
          </div>
          <div className="mt-4 text-base font-medium text-ink">
            {activeTab.label}搜索
          </div>
          <div className="mt-1 text-sm text-ink-subtle">
            在上方搜索框输入关键词，即可在页面内预览「{activeTab.label}」结果
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {["React", "AI", "天气", "编程"].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  useAppStore.getState().setKeyword(tag);
                }}
                className="rounded-full border border-stroke bg-white/5 px-3 py-1 text-xs text-ink-muted transition-colors hover:border-stroke-hover hover:text-ink"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
