import AppFooter from "@/components/AppFooter";
import BottomNavBar from "@/components/BottomNavBar";

/**
 * 360 风格底部：页面底部信息（备案/版权/友情链接） + 移动端底部导航
 * 只布局包装，不包含其他业务逻辑
 */
export default function FooterActions() {
  return (
    <footer className="relative z-10 mt-8 w-full">
      <AppFooter />
      <BottomNavBar />
    </footer>
  );
}
