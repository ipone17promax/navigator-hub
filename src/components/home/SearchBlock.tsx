import * as Icons from "lucide-react";
import GreetingClock from "@/components/GreetingClock";
import SearchHero from "@/components/SearchHero";
import SearchTabs from "@/components/SearchTabs";
import { HighFreqBar } from "@/components/HealthAndFreq";
import QuickTools from "@/components/QuickTools";

/**
 * 360 风格「搜索主区」：
 *   - 顶行：欢迎语 + 实时时钟
 *   - 中间：Navigator logo + 大号搜索框
 *   - 搜索框上方：引擎标签切换（网页 / 图片 / 视频 / 资讯 / 地图 / 学术）
 *   - 搜索框下方：常用搜索引擎健康状态（HighFreqBar）
 *   - 再下方：常用工具抽屉（短链/二维码/加密/Base64…）
 */
export default function SearchBlock() {
  return (
    <section className="relative z-10 px-4 pb-3 pt-4 sm:px-6">
      <div className="mx-auto w-full max-w-3xl flex flex-col items-center gap-3">
        <GreetingClock />
        <div className="relative w-full">
          <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] bg-brand-gradient opacity-15 blur-2xl animate-pulse-glow" />
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-glow-xs">
              <Icons.Share2 size={18} className="text-white" />
            </div>
            <span className="bg-gradient-to-r from-brand-500 to-purple-500 bg-clip-text text-xl font-extrabold tracking-wide text-transparent">
              NavigatorHub
            </span>
          </div>
          <SearchTabs />
          <SearchHero />
        </div>
        <HighFreqBar />
        <QuickTools />
      </div>
    </section>
  );
}
