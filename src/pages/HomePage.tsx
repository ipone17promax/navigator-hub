import { useState } from "react";
import * as Icons from "lucide-react";
import GreetingClock from "@/components/GreetingClock";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import SearchHero from "@/components/SearchHero";
import SearchTabs from "@/components/SearchTabs";
import CategoryTabs from "@/components/CategoryTabs";
import SiteGrid from "@/components/SiteGrid";
import AppFooter from "@/components/AppFooter";
import WeatherWidget from "@/components/WeatherWidget";
import NewsStream from "@/components/NewsStream";
import MiniCalendar from "@/components/MiniCalendar";
import QuickTools from "@/components/QuickTools";
import StockWidget from "@/components/StockWidget";
import FeaturedHighlights from "@/components/FeaturedHighlights";
import BottomNavBar from "@/components/BottomNavBar";
import FontSizeToggle from "@/components/FontSizeToggle";
import InternalDebugPanel from "@/components/InternalDebugPanel";
import LoginCard from "@/components/LoginCard";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * 主页：基于服务器端身份验证的三态渲染
 *
 * - loading：身份未定时渲染加载占位，避免提前露出管理员内容
 * - admin  ：标识 9B1G01-9B1G99 通过服务器端验证，渲染完整管理员界面
 *            （含 StockWidget 行情、InternalDebugPanel 调试面板、管理员徽章）
 * - guest  ：未授权通用用户，渲染精简公开界面 + 管理员入口按钮
 *
 * 安全保证：
 *   管理员专属模块（StockWidget / InternalDebugPanel）在前端仅在 status==="admin"
 *   时挂载；身份由 Netlify Edge Function 在服务器端用 HMAC 签名 Cookie 校验，
 *   客户端无法伪造。
 */
export default function HomePage() {
  const status = useAuthStore((s) => s.status);
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin);
  const [loginOpen, setLoginOpen] = useState(false);

  // 身份未定时：渲染最小化加载屏，不渲染任何业务内容
  if (status === "loading") {
    return <LoadingScreen />;
  }

  const isAdmin = status === "admin";

  return (
    <div className="cyber-bg">
      <div className="container mx-auto max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8">
        {/* ============== 顶栏 ============== */}
        <header className="flex w-full items-center justify-between pb-3">
          <BrandLogo />
          <div className="flex items-center gap-3">
            <QuickDate />
            <FontSizeToggle />
            <ThemeSwitcher />
            {isAdmin ? (
              isSuperAdmin ? <SuperAdminBadge /> : <AdminBadge />
            ) : (
              <AdminEntryButton onClick={() => setLoginOpen(true)} />
            )}
          </div>
        </header>

        {/* ============== 搜索区域 + 视觉预览 ============== */}
        <section className="mb-6 mt-2 flex flex-col items-center gap-3">
          <GreetingClock />
          <div className="w-full max-w-[880px]">
            <SearchHero />
          </div>
          <SearchTabs />
          <FeaturedHighlights />
        </section>

        {/* ============== 两栏布局（原右栏热搜榜已移除）============== */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
          {/* ===== 左栏 ===== */}
          <aside className="flex min-w-0 flex-col gap-4">
            <WeatherWidget />
            <MiniCalendar />
            <QuickTools />
          </aside>

          {/* ===== 中栏（min-w-0 防止 grid item 被内容撑开导致水平溢出） ===== */}
          <main className="flex min-w-0 flex-col gap-4">
            <NewsStream />
            <CategoryTabs />
            <SiteGrid />
          </main>
        </div>

        {/* ===== 行情组件：管理员专属，整行显示 ===== */}
        {isAdmin && (
          <div className="mt-2 w-full max-w-[1440px]">
            <StockWidget />
          </div>
        )}

        {/* ===== 底部快速导航栏：可横向拖动 ===== */}
        <div className="mt-4 w-full max-w-[1440px]">
          <BottomNavBar />
        </div>

        <AppFooter />

        {/* 内部调试面板：仅特级管理员可见 */}
        {isAdmin && isSuperAdmin && <InternalDebugPanel />}

        {/* 管理员登录弹窗：仅 guest 状态触发 */}
        {loginOpen && !isAdmin && <LoginCard onClose={() => setLoginOpen(false)} />}
      </div>
    </div>
  );
}

// ============================================================
// 加载屏：身份未定时展示
// ============================================================
function LoadingScreen() {
  return (
    <div className="cyber-bg flex min-h-screen items-center justify-center">
      <div className="text-center animate-fade-in-up">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
        <p className="mt-4 text-sm text-ink-muted">正在连接安全通道…</p>
        <p className="mt-1 text-[11px] text-ink-subtle">NavigatorHub · 安全通道</p>
      </div>
    </div>
  );
}

// ============================================================
// 管理员徽章：admin 状态下显示
// ============================================================
function AdminBadge() {
  return (
    <div
      className="flex items-center gap-1.5 rounded-lg border border-brand-primary/40 bg-brand-primary/10 px-2.5 py-1.5 text-xs text-brand-primary"
      title="已通过管理员访问码验证"
    >
      <Icons.ShieldCheck size={14} />
      <span className="font-semibold">管理员</span>
    </div>
  );
}

// ============================================================
// 特级管理员徽章：password-01 专属
// ============================================================
function SuperAdminBadge() {
  return (
    <div
      className="flex items-center gap-1.5 rounded-lg border border-amber-400/50 bg-amber-400/10 px-2.5 py-1.5 text-xs text-amber-400"
      title="特级管理员 · 创作者"
    >
      <Icons.Crown size={14} />
      <span className="font-semibold">特级管理员</span>
    </div>
  );
}

// ============================================================
// 管理员入口按钮：guest 状态下显示，点击弹出 LoginCard
// ============================================================
function AdminEntryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="管理员访问入口"
      className="flex items-center gap-1.5 rounded-lg border border-stroke bg-bg-elevate/60 px-2.5 py-1.5 text-xs text-ink-muted transition-all hover:border-stroke-hover hover:text-ink"
    >
      <Icons.Lock size={14} />
      <span>管理员</span>
    </button>
  );
}

function BrandLogo() {
  return (
    <div className="flex shrink-0 items-center gap-2 animate-fade-in-up">
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-glow">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
      </div>
      <div className="leading-tight">
        <div className="font-display text-[15px] font-bold tracking-wide text-ink sm:text-base">
          Navigator<span className="text-brand-gradient">Hub</span>
        </div>
        <div className="text-[11px] text-ink-muted">星际导航中心 · v2.0</div>
      </div>
    </div>
  );
}

function QuickDate() {
  const now = new Date();
  const dateStr = `${now.getMonth() + 1}月${now.getDate()}日`;
  const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return (
    <div className="hidden text-right sm:block">
      <div className="text-sm font-medium text-ink">{dateStr}</div>
      <div className="text-[11px] text-ink-subtle">{weekDays[now.getDay()]}</div>
    </div>
  );
}
