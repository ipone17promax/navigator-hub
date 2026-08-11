import { lazy, Suspense, useEffect } from "react";
import { HashRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import { logger } from "@/lib/logger";
import { useAuthStore } from "@/stores/useAuthStore";
import { useI18n } from "@/i18n";

const StormTrackerPage = lazy(() => import("@/pages/StormTrackerPage"));
const BinaryParserPage = lazy(() => import("@/pages/BinaryParserPage"));
const MorseCodePage = lazy(() => import("@/pages/MorseCodePage"));
const CompassClockPage = lazy(() => import("@/pages/CompassClockPage"));

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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}