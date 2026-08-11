import * as Icons from "lucide-react";
import { useI18n } from "@/i18n";

interface ToolItem {
  nameKey:
    | "translate"
    | "calculator"
    | "unitConvert"
    | "exchangeRate"
    | "express"
    | "calendar"
    | "email"
    | "cloudDisk";
  icon: string;
  color: string;
  url: string;
}

const TOOLS: ToolItem[] = [
  { nameKey: "translate" as const,    icon: "Languages",   color: "#38BDF8", url: "https://fanyi.baidu.com/" },
  { nameKey: "calculator" as const,   icon: "Calculator",  color: "#A78BFA", url: "https://www.baidu.com/s?wd=在线计算器" },
  { nameKey: "unitConvert" as const,  icon: "Ruler",       color: "#34D399", url: "https://www.baidu.com/s?wd=单位换算" },
  { nameKey: "exchangeRate" as const, icon: "DollarSign",  color: "#FBBF24", url: "https://www.boc.cn/sourcedb/whpj/" },
  { nameKey: "express" as const,      icon: "Package",     color: "#F87171", url: "https://www.kuaidi100.com/" },
  { nameKey: "calendar" as const,     icon: "Calendar",    color: "#60A5FA", url: "https://wannianrili.51240.com/" },
  { nameKey: "email" as const,        icon: "Inbox",       color: "#22D3EE", url: "https://mail.qq.com/" },
  { nameKey: "cloudDisk" as const,    icon: "HardDrive",   color: "#EC4899", url: "https://pan.baidu.com/" },
];

export default function QuickTools() {
  const { t } = useI18n();
  return (
    <div className="rounded-2xl border border-stroke bg-bg-elevate/60 p-4 backdrop-blur-xl transition-all duration-300 hover:border-stroke-hover">
      <div className="mb-3 flex items-center gap-2">
        <Icons.Wrench size={16} className="text-cyan-400" />
        <span className="text-sm font-semibold text-ink">{t.quickTools}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {TOOLS.map((tool) => {
          const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[tool.icon] ?? Icons.Wrench;
          return (
            <a
              key={tool.nameKey}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-1.5 rounded-xl border border-stroke/50 bg-white/5 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-stroke-hover hover:bg-white/10"
            >
              <Icon size={20} style={{ color: tool.color }} className="transition-transform duration-200 group-hover:scale-110" />
              <span className="text-[11px] text-ink-muted transition-colors group-hover:text-ink">{t.toolNames[tool.nameKey]}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
