import FeaturedHighlights from "@/components/FeaturedHighlights";
import CategoryTabs from "@/components/CategoryTabs";
import SiteGrid from "@/components/SiteGrid";

/**
 * 360 风格主内容区：
 *   - 顶：精选轮播推荐（AI/开发/设计/学习/影音/办公…）
 *   - 中：分类横向切换标签
 *   - 底：站点大网格卡片墙
 */
export default function ContentArea() {
  return (
    <section className="relative z-10 flex flex-col gap-5 px-4 pb-4 sm:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <FeaturedHighlights />
        <CategoryTabs />
        <SiteGrid />
      </div>
    </section>
  );
}
