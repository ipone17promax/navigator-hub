import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const CN_NUMS = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];

export default function CompassClockPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTime, setCurrentTime] = useState("--:--:--");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const now = new Date();
      const hours = now.getHours() % 12;
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      setCurrentTime(now.toLocaleTimeString("zh-CN", { hour12: false }));
      setCurrentDate(
        now.toLocaleDateString("zh-CN", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
        })
      );

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r1 = Math.min(canvas.width, canvas.height) / 2 - 10;
      const r2 = r1 - 40;
      const r3 = r2 - 35;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 背景
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r1);
      gradient.addColorStop(0, "#0a0a0f");
      gradient.addColorStop(1, "#000");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, r1, 0, Math.PI * 2);
      ctx.fill();

      // 同心圆
      for (const r of [r1, r2, r3]) {
        ctx.strokeStyle = "rgba(236, 72, 153, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 分钟刻度
      for (let i = 0; i < 60; i++) {
        const angle = ((i * 6) - 90) * Math.PI / 180;
        const isMajor = i % 5 === 0;
        const rStart = isMajor ? r2 - 5 : r2 - 12;
        const rEnd = r2 + 2;

        ctx.strokeStyle = isMajor ? "#00ff88" : "rgba(0, 255, 136, 0.3)";
        ctx.lineWidth = isMajor ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(cx + rStart * Math.cos(angle), cy + rStart * Math.sin(angle));
        ctx.lineTo(cx + rEnd * Math.cos(angle), cy + rEnd * Math.sin(angle));
        ctx.stroke();
      }

      // 小时数字
      for (let i = 0; i < 12; i++) {
        const angle = ((i * 30) - 90) * Math.PI / 180;
        const x = cx + r1 * 0.72 * Math.cos(angle);
        const y = cy + r1 * 0.72 * Math.sin(angle);

        ctx.font = "bold 18px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = i === hours ? "#ff00ff" : "#00ffff";
        ctx.shadowColor = i === hours ? "#ff00ff" : "#00ffff";
        ctx.shadowBlur = i === hours ? 15 : 8;
        ctx.fillText(CN_NUMS[i], x, y);
      }

      // 时针
      const hourAngle = ((hours * 30 + minutes * 0.5) - 90) * Math.PI / 180;
      ctx.strokeStyle = "#ff00ff";
      ctx.lineWidth = 5;
      ctx.shadowColor = "#ff00ff";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + r3 * 0.55 * Math.cos(hourAngle), cy + r3 * 0.55 * Math.sin(hourAngle));
      ctx.stroke();

      // 分针
      const minAngle = ((minutes * 6 + seconds * 0.1) - 90) * Math.PI / 180;
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 4;
      ctx.shadowColor = "#00ff00";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + r2 * 0.65 * Math.cos(minAngle), cy + r2 * 0.65 * Math.sin(minAngle));
      ctx.stroke();

      // 秒针
      const secAngle = (seconds * 6 - 90) * Math.PI / 180;
      ctx.strokeStyle = "#00ffff";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#00ffff";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + r1 * 0.82 * Math.cos(secAngle), cy + r1 * 0.82 * Math.sin(secAngle));
      ctx.stroke();

      // 中心点
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#ff00ff";
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#00ffff";
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
    };

    draw();
    const interval = setInterval(draw, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="cyber-bg min-h-screen">
      <div className="container mx-auto max-w-3xl px-4 py-6">
        {/* 顶栏 */}
        <header className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm text-ink-muted transition-all hover:bg-white/10 hover:text-ink"
          >
            <ArrowLeft size={16} /> 返回导航中心
          </Link>
          <div className="text-xs text-ink-muted">罗盘时钟 v1.0</div>
        </header>

        {/* 标题 */}
        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">罗盘时钟</h1>
          <p className="mt-2 text-sm text-ink-muted">中国传统罗盘风格 · 三层同心圆设计</p>
        </div>

        {/* 时钟画布 */}
        <div className="glass-card p-6">
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              className="max-w-full rounded-full"
            />
          </div>

          {/* 时间日期显示 */}
          <div className="mt-6 text-center">
            <div className="font-mono text-3xl font-bold text-brand" style={{ textShadow: "0 0 20px rgba(236, 72, 153, 0.5)" }}>
              {currentTime}
            </div>
            <div className="mt-2 text-sm text-ink-muted">{currentDate}</div>
          </div>

          {/* 图例 */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#ff00ff] shadow-[0_0_10px_#ff00ff]" />
              <span className="text-ink-muted">时针</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#00ff00] shadow-[0_0_10px_#00ff00]" />
              <span className="text-ink-muted">分针</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#00ffff] shadow-[0_0_10px_#00ffff]" />
              <span className="text-ink-muted">秒针</span>
            </div>
          </div>
        </div>

        {/* 说明 */}
        <div className="mt-6 rounded-xl border border-stroke bg-white/5 p-5 text-sm text-ink-muted">
          <h4 className="mb-2 font-display font-semibold text-ink">设计说明</h4>
          <ul className="list-inside list-disc space-y-1">
            <li>外层：60 分钟刻度，5 分钟为大刻度（绿色）</li>
            <li>中层：12 小时数字，使用中文数字（一、二、三...）</li>
            <li>内层：三根指针，分别代表时、分、秒</li>
            <li>当前小时数字高亮为紫色，指针带发光效果</li>
          </ul>
        </div>
      </div>
    </div>
  );
}