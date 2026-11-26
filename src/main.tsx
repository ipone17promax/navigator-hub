import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { I18nProvider } from "./i18n";
import ErrorBoundary from "./components/ErrorBoundary";
import { logger } from "./lib/logger";

logger.info("Bootstrap", "应用启动", { ua: navigator.userAgent });

// 首次启动初始化背景层
setTimeout(() => {
  const preset = localStorage.getItem("nh.bg.preset") || "starfield";
  const opacity = parseFloat(localStorage.getItem("nh.bg.opacity") || "0.85");
  const custom = localStorage.getItem("nh.bg.customImage") || "";
  const layer = document.getElementById("app-bg-layer");
  if (layer) {
    const clsMap: Record<string, string> = {
      starfield: "bg-starfield", aurora: "bg-aurora", deepsea: "bg-deepsea",
      sunset: "bg-sunset", neon: "bg-neon", cyber: "bg-cyber", minimal: "bg-minimal",
      sakura: "bg-sakura", warm: "bg-warm", matrix: "bg-matrix",
    };
    if (custom) {
      layer.className = "fixed inset-0 -z-10";
      if (custom.startsWith("linear-gradient") || custom.startsWith("radial-gradient")) {
        layer.style.backgroundImage = custom;
      } else {
        layer.style.backgroundImage = `url(${custom})`;
        layer.style.backgroundSize = "cover";
        layer.style.backgroundPosition = "center";
      }
    } else {
      layer.className = "fixed inset-0 -z-10 " + (clsMap[preset] || "bg-starfield");
      layer.style.backgroundImage = "";
    }
    layer.style.opacity = String(opacity);
  }
}, 0);

// 注册 Service Worker（仅生产环境；开发环境保留 Vite HMR 缓存行为）
if (import.meta.env.PROD && "serviceWorker" in navigator &&
    (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
  window.addEventListener("load", () => {
    const swUrl = import.meta.env.BASE_URL.replace(/\/?$/, "/sw.js");
    navigator.serviceWorker.register(swUrl, { scope: import.meta.env.BASE_URL })
      .then((reg) => logger.info("PWA", "SW 注册成功", { scope: reg.scope }))
      .catch((err) => logger.warn("PWA", "SW 注册失败", err));
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

/**
 * 首屏骨架收尾：等 React 真正把内容挂到 #root 后再淡出骨架，
 * 避免并发渲染下「骨架先没了、内容还没上」的空白帧。
 */
(function dismissBootShell() {
  const boot = document.getElementById("boot-shell");
  if (!boot) return;
  const started = performance.now();
  const tick = () => {
    const ready = (document.getElementById("root")?.childElementCount ?? 0) > 0;
    if (ready || performance.now() - started > 4000) {
      boot.style.opacity = "0";
      boot.remove();
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
