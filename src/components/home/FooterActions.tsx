import { useState } from "react";
import AppFooter from "@/components/AppFooter";
import BottomNavBar from "@/components/BottomNavBar";
import SettingsDrawer, { type TabKey } from "@/components/SettingsDrawer";

/**
 * 360 风格底部：页面底部信息（备案/版权/友情链接） + 移动端底部导航
 * 底部导航右侧的设置图标组需要在这里接到 SettingsDrawer，否则 onOpen* 为空、点了没反应
 */
export default function FooterActions() {
  const [drawer, setDrawer] = useState<{ open: boolean; tab: TabKey }>({ open: false, tab: "bg" });
  const open = (tab: TabKey) => setDrawer({ open: true, tab });

  return (
    <footer className="relative z-10 mt-8 w-full">
      <AppFooter />
      <BottomNavBar
        onOpenStats={() => open("stats")}
        onOpenBg={() => open("bg")}
        onOpenCustom={() => open("custom")}
        onOpenSync={() => open("data")}
        onOpenTheme={() => open("theme")}
      />
      <SettingsDrawer
        open={drawer.open}
        initial={drawer.tab}
        onClose={() => setDrawer((d) => ({ ...d, open: false }))}
      />
    </footer>
  );
}
