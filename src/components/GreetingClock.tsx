import { useEffect, useState } from "react";
import { useI18n } from "@/i18n";

function pickGreeting(
  hour: number,
  t: ReturnType<typeof useI18n>["t"],
): { text: string; accent: string } {
  if (hour >= 5 && hour < 11)
    return { text: t.greetingMorning, accent: "from-amber-300 to-orange-400" };
  if (hour >= 11 && hour < 14)
    return { text: t.greetingNoon, accent: "from-yellow-300 to-amber-500" };
  if (hour >= 14 && hour < 18)
    return { text: t.greetingAfternoon, accent: "from-sky-300 to-indigo-400" };
  if (hour >= 18 && hour < 23)
    return { text: t.greetingEvening, accent: "from-fuchsia-400 to-pink-500" };
  return { text: t.greetingNight, accent: "from-indigo-400 to-purple-500" };
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export default function GreetingClock() {
  const { t } = useI18n();
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const greeting = pickGreeting(now.getHours(), t);
  const time = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
  const date = `${now.getFullYear()}${t.monthUnit}${now.getMonth() + 1}${t.dayUnit} · ${t.weekDays[now.getDay()]}`;

  return (
    <div className="pointer-events-none select-none text-center animate-fade-in-up">
      <div
        className="font-display tabular-nums tracking-tight text-ink drop-shadow-[0_0_30px_rgba(99,102,241,0.35)]"
        style={{ fontSize: "clamp(2.5rem, 7vw, 4.5rem)", fontWeight: 700, lineHeight: 1.05 }}
      >
        {time}
      </div>
      <div className="mt-3 font-display text-xl font-semibold md:text-2xl">
        <span
          className={`bg-gradient-to-r ${greeting.accent} bg-clip-text text-transparent`}
        >
          {greeting.text}
        </span>
      </div>
      <div className="mt-2 text-sm text-ink-muted md:text-base">{date}</div>
    </div>
  );
}
