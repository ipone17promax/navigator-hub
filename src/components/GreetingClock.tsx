import { useEffect, useState } from "react";

/**
 * 根据时段返回中文问候语
 */
function pickGreeting(hour: number): { text: string; accent: string } {
  if (hour >= 5 && hour < 11) return { text: "早上好，欢迎回到导航中心", accent: "from-amber-300 to-orange-400" };
  if (hour >= 11 && hour < 14) return { text: "中午好，小憩之后继续奋战", accent: "from-yellow-300 to-amber-500" };
  if (hour >= 14 && hour < 18) return { text: "下午好，保持专注高效",     accent: "from-sky-300 to-indigo-400" };
  if (hour >= 18 && hour < 23) return { text: "晚上好，别忘了劳逸结合",   accent: "from-fuchsia-400 to-pink-500" };
  return { text: "夜深了，注意休息再出发",   accent: "from-indigo-400 to-purple-500" };
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

const WEEK_MAP = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

export default function GreetingClock() {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const greeting = pickGreeting(now.getHours());
  const time = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
  const date = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日 · ${WEEK_MAP[now.getDay()]}`;

  return (
    <div className="pointer-events-none select-none text-center animate-fade-in-up">
      {/* 时间 */}
      <div
        className="font-display tabular-nums tracking-tight text-ink drop-shadow-[0_0_30px_rgba(99,102,241,0.35)]"
        style={{ fontSize: "clamp(2.5rem, 7vw, 4.5rem)", fontWeight: 700, lineHeight: 1.05 }}
      >
        {time}
      </div>

      {/* 问候语 */}
      <div className="mt-3 font-display text-xl font-semibold md:text-2xl">
        <span className={`bg-gradient-to-r ${greeting.accent} bg-clip-text text-transparent`}>
          {greeting.text}
        </span>
      </div>

      {/* 日期 */}
      <div className="mt-2 text-sm text-ink-muted md:text-base">
        {date}
      </div>
    </div>
  );
}
