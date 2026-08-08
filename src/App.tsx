import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import { logger } from "@/lib/logger";
import { useAuthStore } from "@/stores/useAuthStore";

// 路由级懒加载：每个页面拆成独立 chunk，首屏只加载 HomePage
const StormTrackerPage = lazy(() => import("@/pages/StormTrackerPage"));
const BinaryParserPage = lazy(() => import("@/pages/BinaryParserPage"));
const MorseCodePage = lazy(() => import("@/pages/MorseCodePage"));
const CompassClockPage = lazy(() => import("@/pages/CompassClockPage"));

// 懒加载骨架屏
function PageLoader() {
  return (
    <div className="cyber-bg flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
        <p className="mt-4 text-sm text-ink-muted">正在加载…</p>
      </div>
    </div>
  );
}

// 路由变化日志（必须在 Router 内部使用 useLocation）
function RouteLogger() {
  const location = useLocation();
  useEffect(() => {
    logger.info("Router", "导航", { path: location.pathname + location.search });
  }, [location.pathname, location.search]);
  return null;
}

export default function App() {
  // 应用启动时调用一次身份初始化（向 /api/verify 校验签名 cookie）
  // useAuthStore 内部有 initStarted 幂等守卫，StrictMode 双调用安全
  const initAuth = useAuthStore((s) => s.init);
  useEffect(() => {
    void initAuth();
  }, [initAuth]);

  return (
    <Router>
      <RouteLogger />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/storm-tracker" element={<StormTrackerPage />} />
          <Route path="/binary-parser" element={<BinaryParserPage />} />
          <Route path="/morse-code" element={<MorseCodePage />} />
          <Route path="/compass-clock" element={<CompassClockPage />} />
          <Route
            path="*"
            element={
              <div className="cyber-bg flex min-h-screen items-center justify-center">
                <div className="text-center animate-fade-in-up">
                  <div className="font-display text-7xl font-bold text-brand-gradient">404</div>
                  <p className="mt-4 text-ink-muted">找不到对应的星际坐标</p>
                  <a
                    href="/"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:-translate-y-0.5"
                  >
                    返回母港
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
}
