import { EyeOff } from "lucide-react";
import { useAppStore } from "@/stores/useAppStore";

/**
 * 老人模式退出条
 * 固定在底部导航上方，保证任何页面、任何滚动位置都能一键退出
 * 解决移动端放大 25% 后顶部开关被挤出可视区的问题
 */
export default function ElderExitBar() {
  const elderlyMode = useAppStore((s) => s.elderlyMode);
  const toggleElderlyMode = useAppStore((s) => s.toggleElderlyMode);
  if (!elderlyMode) return null;
  return (
    <div
      className="elder-exit pointer-events-none fixed inset-x-0 z-[45] mx-auto flex w-full max-w-md justify-center px-4"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 88px)" }}
    >
      <button
        type="button"
        onClick={() => toggleElderlyMode()}
        aria-label="退出老人模式并恢复默认字号"
        className="pointer-events-auto inline-flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-amber-300/70 bg-amber-400 px-5 py-3.5 text-base font-bold text-slate-900 shadow-2xl transition-transform active:scale-[0.98]"
      >
        <EyeOff size={20} />
        退出老人模式
      </button>
    </div>
  );
}