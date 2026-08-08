import * as Icons from "lucide-react";

interface ToolItem {
  name: string;
  icon: string;
  color: string;
  url: string;
}

const TOOLS: ToolItem[] = [
  { name: "翻译",    icon: "Languages",   color: "#38BDF8", url: "https://fanyi.baidu.com/" },
  { name: "计算器",  icon: "Calculator",  color: "#A78BFA", url: "https://www.baidu.com/s?wd=在线计算器" },
  { name: "单位换算",icon: "Ruler",       color: "#34D399", url: "https://www.baidu.com/s?wd=单位换算" },
  { name: "汇率",    icon: "DollarSign",  color: "#FBBF24", url: "https://www.boc.cn/sourcedb/whpj/" },
  { name: "快递",    icon: "Package",     color: "#F87171", url: "https://www.kuaidi100.com/" },
  { name: "日历",    icon: "Calendar",    color: "#60A5FA", url: "https://wannianrili.51240.com/" },
  { name: "邮箱",    icon: "Inbox",       color: "#22D3EE", url: "https://mail.qq.com/" },
  { name: "网盘",    icon: "HardDrive",   color: "#EC4899", url: "https://pan.baidu.com/" },
];

export default function QuickTools() {
  return (
    <div className="rounded-2xl border border-stroke bg-bg-elevate/60 p-4 backdrop-blur-xl transition-all duration-300 hover:border-stroke-hover">
      <div className="mb-3 flex items-center gap-2">
        <Icons.Wrench size={16} className="text-cyan-400" />
        <span className="text-sm font-semibold text-ink">快捷工具</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {TOOLS.map((tool) => {
          const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[tool.icon] ?? Icons.Wrench;
          return (
            <a
              key={tool.name}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-1.5 rounded-xl border border-stroke/50 bg-white/5 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-stroke-hover hover:bg-white/10"
            >
              <Icon size={20} style={{ color: tool.color }} className="transition-transform duration-200 group-hover:scale-110" />
              <span className="text-[11px] text-ink-muted transition-colors group-hover:text-ink">{tool.name}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
