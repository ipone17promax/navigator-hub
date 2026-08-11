import WeatherWidget from "@/components/WeatherWidget";
import MiniCalendar from "@/components/MiniCalendar";
import StockWidget from "@/components/StockWidget";
import NewsStream from "@/components/NewsStream";

/**
 * 360 风格右侧信息栏（从上到下顺序对齐 360 导航：天气 → 日历 → 股市 → 新闻）
 * 固定宽度，1500+ 屏才显示，避免在中等尺寸上拥挤
 */
export default function RightPanel() {
  return (
    <aside className="hidden xl:flex w-80 shrink-0 flex-col gap-3 pt-2">
      <WeatherWidget />
      <MiniCalendar />
      <StockWidget />
      <NewsStream />
    </aside>
  );
}
