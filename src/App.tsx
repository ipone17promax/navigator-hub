import { lazy, Suspense, useEffect } from "react";
import { HashRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import { logger } from "@/lib/logger";
import { decodeSync } from "@/lib/syncCode";
import { useAppStore } from "@/stores/useAppStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUserStore } from "@/stores/useUserStore";
import { useI18n } from "@/i18n";

const StormTrackerPage = lazy(() => import("@/pages/StormTrackerPage"));
const BinaryParserPage = lazy(() => import("@/pages/BinaryParserPage"));
const MorseCodePage = lazy(() => import("@/pages/MorseCodePage"));
const CompassClockPage = lazy(() => import("@/pages/CompassClockPage"));
const QrCodePage = lazy(() => import("@/pages/QrCodePage"));
const JsonFormatterPage = lazy(() => import("@/pages/JsonFormatterPage"));

function PageLoader() {
  const { t } = useI18n();
  return (
    <div className="cyber-bg flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
        <p className="mt-4 text-sm text-ink-muted">{t.pageLoading}</p>
      </div>
    </div>
  );
}

function RouteLogger() {
  const location = useLocation();
  useEffect(() => {
    logger.info("Router", "nav", { path: location.pathname + location.search });
  }, [location.pathname, location.search]);
  return null;
}

function NotFound() {
  const { t } = useI18n();
  return (
    <div className="cyber-bg flex min-h-screen items-center justify-center">
      <div className="text-center animate-fade-in-up">
        <div className="font-display text-7xl font-bold text-brand-gradient">{t.notFoundCode}</div>
        <p className="mt-4 text-ink-muted">{t.notFound}</p>
        <a
          href="#/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:-translate-y-0.5"
        >
          {t.backHome}
        </a>
      </div>
    </div>
  );
}

export default function App() {
  const initAuth = useAuthStore((s) => s.init);
  const elderlyMode = useAppStore((s) => s.elderlyMode);
  const { locale } = useI18n();
  useEffect(() => {
    void initAuth();
  }, [initAuth]);

  // 关爱老人模式：把状态同步到 <html>，由 CSS 统一放大字号与点击区域
  useEffect(() => {
    document.documentElement.dataset.elder = elderlyMode ? "true" : "false";
  }, [elderlyMode]);

  // 跨端同步：链接里带 ?sync= 时提示导入
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("sync");
    if (!code) return;
    const zh = locale === "zh";
    const clean = () => history.replaceState(null, "", window.location.pathname + window.location.hash);
    if (!window.confirm(zh ? "检测到跨端同步数据，是否导入到本机？" : "Sync data found. Import to this device?")) {
      clean();
      return;
    }
    decodeSync(code)
      .then((data) => {
        const ok = useUserStore.getState().importJSON(JSON.stringify(data));
        window.alert(ok ? (zh ? "同步完成，数据已导入" : "Sync complete") : (zh ? "同步失败，同步码可能已损坏" : "Sync failed: invalid code"));
      })
      .catch(() => window.alert(zh ? "同步失败，同步码可能已损坏" : "Sync failed: invalid code"))
      .finally(clean);
  }, [locale]);

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
          <Route path="/qr-code" element={<QrCodePage />} />
          <Route path="/json-formatter" element={<JsonFormatterPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}