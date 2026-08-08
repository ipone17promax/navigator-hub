import { useAppStore } from "@/stores/useAppStore";
import { Eye, EyeOff } from "lucide-react";

/** 关爱老人模式：切换全局字体放大 */
export default function FontSizeToggle() {
  const elderlyMode = useAppStore((s) => s.elderlyMode);
  const toggleElderlyMode = useAppStore((s) => s.toggleElderlyMode);

  return (
    <button
      onClick={() => toggleElderlyMode()}
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all ${
        elderlyMode
          ? "border-amber-400/50 bg-amber-400/20 text-amber-300"
          : "border-stroke text-ink-subtle hover:bg-white/10 hover:text-ink"
      }`}
      title={elderlyMode ? "点击恢复默认字号" : "点击放大字号（关爱老人模式）"}
      aria-pressed={elderlyMode}
    >
      {elderlyMode ? (
        <Eye size={14} />
      ) : (
        <EyeOff size={14} />
      )}
      <span className="font-medium">
        {elderlyMode ? "老人模式 开" : "老人模式"}
      </span>
      <span className="text-[10px] opacity-70">A+</span>
    </button>
  );
}
