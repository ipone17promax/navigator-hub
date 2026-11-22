import { useEffect, useState } from "react";
import * as Icons from "@/lib/iconRegistry";
import { useI18n } from "@/i18n";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "nh.pwa.dismissed";

/**
 * PWA 安装引导：仅在浏览器支持 beforeinstallprompt 且用户未忽略时出现
 * 桌面端左下角展示，移动端交给浏览器菜单，避免和底部导航冲突
 */
export default function PwaInstall() {
  const { locale } = useI18n();
  const zh = locale === "zh";
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!evt || dismissed || installed) return null;

  const install = async () => {
    try {
      await evt.prompt();
      const choice = await evt.userChoice;
      if (choice.outcome === "accepted") setEvt(null);
    } catch {
      /* 用户取消或浏览器不支持 */
    }
  };

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="pwa-install fixed bottom-24 left-4 z-30 hidden items-center gap-2 rounded-2xl border border-stroke bg-bg-base/95 px-3 py-2 shadow-card backdrop-blur-xl md:flex">
      <Icons.Download size={14} className="text-brand-primary" />
      <span className="text-[12px] text-ink">{zh ? "安装到桌面" : "Install app"}</span>
      <button
        onClick={() => void install()}
        className="rounded-lg bg-brand-gradient px-2 py-1 text-[11px] font-medium text-white"
      >
        {zh ? "安装" : "Install"}
      </button>
      <button
        onClick={dismiss}
        className="rounded-md p-1 text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
        aria-label={zh ? "以后再说" : "Dismiss"}
      >
        <Icons.X size={12} />
      </button>
    </div>
  );
}