import WeatherWidget from "@/components/WeatherWidget";
import MiniCalendar from "@/components/MiniCalendar";
import StockWidget from "@/components/StockWidget";
import NewsStream from "@/components/NewsStream";

/**
 * 360 风格信息条：站点网格下方，横排 4 列
 * 响应式：<640px 单列、640~1024 两列、>=1024 四列
 * 不删任何组件，只是把右栏的 4 个组件改成横向网格
 */
export default function InfoStrip() {
  return (
    <section className="relative z-10 px-4 pb-4 sm:px-6">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <WeatherWidget />
        <MiniCalendar />
        <StockWidget />
        <NewsStream />
      </div>
    </section>
  );
}
