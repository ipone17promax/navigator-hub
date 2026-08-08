import { useState } from "react";
import * as Icons from "lucide-react";

/** 简化的农历日期映射（演示用，实际可用 lunar-javascript 库） */
const LUNAR_DAYS = [
  "初一","初二","初三","初四","初五","初六","初七","初八","初九","初十",
  "十一","十二","十三","十四","十五","十六","十七","十八","十九","二十",
  "廿一","廿二","廿三","廿四","廿五","廿六","廿七","廿八","廿九","三十",
];

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const MONTHS = ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];

interface CalendarEvent {
  day: number;
  title: string;
  color: string;
}

export default function MiniCalendar() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 模拟事件
  const events: CalendarEvent[] = [
    { day: today.getDate(), title: "今天", color: "bg-brand-primary" },
    { day: 15, title: "月圆", color: "bg-amber-400" },
  ];

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const lunarDay = LUNAR_DAYS[(today.getDate() - 1) % 30];

  return (
    <div className="rounded-2xl border border-stroke bg-bg-elevate/60 p-4 backdrop-blur-xl transition-all duration-300 hover:border-stroke-hover">
      {/* 头部：年月 + 导航 */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-ink">{year}年 {MONTHS[month]}</div>
          <div className="text-[11px] text-ink-subtle">农历{lunarDay} · 星期{WEEKDAYS[today.getDay()]}</div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
            className="rounded-lg p-1.5 text-ink-subtle transition-colors hover:bg-white/5 hover:text-ink"
          >
            <Icons.ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="rounded-lg p-1.5 text-ink-subtle transition-colors hover:bg-white/5 hover:text-ink"
          >
            <Icons.CircleDot size={16} />
          </button>
          <button
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
            className="rounded-lg p-1.5 text-ink-subtle transition-colors hover:bg-white/5 hover:text-ink"
          >
            <Icons.ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 星期表头 */}
      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`text-center text-[11px] font-medium ${i === 0 || i === 6 ? "text-orange-400" : "text-ink-subtle"}`}
          >
            {w}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const isSelected = day === selectedDay;
          const event = events.find((e) => e.day === day);
          const isWeekend = i % 7 === 0 || i % 7 === 6;
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(day)}
              className={`relative flex h-8 items-center justify-center rounded-lg text-xs transition-all duration-200 ${
                isToday
                  ? "bg-brand-gradient font-bold text-white shadow-glow"
                  : isSelected
                    ? "bg-white/10 text-ink"
                    : isWeekend
                      ? "text-orange-400/80 hover:bg-white/5"
                      : "text-ink-muted hover:bg-white/5 hover:text-ink"
              }`}
            >
              {day}
              {event && !isToday && (
                <span className={`absolute bottom-0.5 h-1 w-1 rounded-full ${event.color}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
