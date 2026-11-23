import { Suspense, lazy } from "react";
import MiniCalendar from "@/components/MiniCalendar";
import NewsStream from "@/components/NewsStream";

// 方案第 3 步 A：第三方小组件按需加载，首屏信息条只下发布局骨架
const WeatherWidget = lazy(() => import("@/components/WeatherWidget"));
const StockWidget = lazy(() => import("@/components/StockWidget"));

/**
 * 360 风格信息条：站点网格下方，横排 4 列
 * 响应式：<640px 单列、640~1024 两列、>=1024 四列
 * 不删任何组件，只是把右栏的 4 个组件改成横向网格
 */
export default function InfoStrip() {
  return (
    <section className="relative z-10 px-4 pb-4 sm:px-6">
      <div className="info-grid mx-auto grid w-full max-w-7xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<div className="min-h-[180px] rounded-2xl border border-stroke bg-bg-elevate/40" />}>
          <WeatherWidget />
        </Suspense>
        <MiniCalendar />
        <Suspense fallback={<div className="min-h-[180px] rounded-2xl border border-stroke bg-bg-elevate/40" />}>
          <StockWidget />
        </Suspense>
        <NewsStream />
      </div>
    </section>
  );
}
