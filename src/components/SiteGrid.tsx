import { useMemo } from "react";
import { Ghost } from "lucide-react";
import { useAppStore } from "@/stores/useAppStore";
import { SITES } from "@/config/sites";
import SiteCard from "./SiteCard";

/**
 * 网站卡片网格：
 * - 受全局分类筛选器 + 关键词过滤
 * - 响应式 2~6 列 Grid
 */
export default function SiteGrid() {
  const activeCategory = useAppStore((s) => s.activeCategory);
  const keyword = useAppStore((s) => s.keyword);

  const list = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return SITES.filter((s) => {
      const categoryOk = activeCategory === "all" ? true : s.category === activeCategory;
      if (!categoryOk) return false;
      if (!kw) return true;
      return (
        s.name.toLowerCase().includes(kw) ||
        s.description.toLowerCase().includes(kw) ||
        s.url.toLowerCase().includes(kw)
      );
    });
  }, [activeCategory, keyword]);

  return (
    <section className="w-full animate-fade-in-up" style={{ animationDelay: "220ms" }}>
      {/* 分类筛选结果数量提示 */}
      <div className="mb-4 flex items-center justify-between text-xs text-ink-muted">
        <div>
          共找到 <span className="font-semibold text-ink">{list.length}</span> 个站点
          {activeCategory !== "all" && <span> · 当前分类筛选中</span>}
        </div>
        <div className="opacity-70">
          提示：<kbd className="rounded border border-stroke bg-white/5 px-1 font-mono">右键</kbd> 卡片可复制链接
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {list.map((site, idx) => (
            <SiteCard key={site.id} site={site} index={idx} />
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="relative">
        <div className="absolute -inset-8 rounded-full bg-brand-gradient-soft opacity-40 blur-2xl" />
        <Ghost size={48} className="relative text-ink-subtle" strokeWidth={1.25} />
      </div>
      <div>
        <p className="font-display text-lg font-semibold text-ink">没有匹配的站点</p>
        <p className="mt-1 text-sm text-ink-muted">
          试试切换其他分类，或清空搜索关键词
        </p>
      </div>
    </div>
  );
}
