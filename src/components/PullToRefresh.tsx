import { useEffect, useRef, useState } from "react";
import * as Icons from "@/lib/iconRegistry";
import { useI18n } from "@/i18n";

/**
 * 移动端下拉刷新
 *   - 仅在触摸设备、页面已滚到顶部、且不是横向滑动时启用
 *   - 下拉带阻尼，超过阈值松手触发；过程中给出文案与进度反馈
 *   - 桌面端不挂任何监听，零额外开销
 */
export default function PullToRefresh() {
  const { locale } = useI18n();
  const zh = locale === "zh";
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pullRef = useRef(0);
  const startRef = useRef<{ x: number; y: number; scrollY: number; active: boolean } | null>(null);
  const moveRef = useRef<{ x: number; y: number } | null>(null);
  const tickingRef = useRef(false);

  const THRESHOLD = 64;
  const MAX = 104;

  useEffect(() => {
    const coarse = window.matchMedia?.("(pointer: coarse)").matches;
    if (!coarse) return;

    const setPullBoth = (v: number) => {
      pullRef.current = v;
      setPull(v);
    };

    const onStart = (e: TouchEvent) => {
      if (refreshing || window.scrollY > 0) return;
      const t = e.touches[0];
      // 只在这里读一次 scrollY 并缓存，touchmove 高频路径不再触发布局读取
      startRef.current = { x: t.clientX, y: t.clientY, scrollY: window.scrollY, active: true };
    };

    const onMove = (e: TouchEvent) => {
      const s = startRef.current;
      if (!s?.active) return;
      const t = e.touches[0];
      // 读阶段：只缓存触摸坐标（事件对象，无布局读取）
      moveRef.current = { x: t.clientX, y: t.clientY };
      const dy = t.clientY - s.y;
      const dx = t.clientX - s.x;
      // 取消与 preventDefault 必须在事件回调内同步完成
      if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) {
        s.active = false;
        setPullBoth(0);
        return;
      }
      if (dy > 6 && e.cancelable) e.preventDefault();
      // 写阶段：所有触发 DOM 更新的操作合并进 rAF
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(() => {
        tickingRef.current = false;
        // scrollY 用 touchstart 时缓存的值，不再读取布局
        if (s.scrollY > 0) {
          s.active = false;
          setPullBoth(0);
          return;
        }
        const m = moveRef.current;
        if (!m) return;
        const damped = Math.min(MAX, (m.y - s.y) * 0.45);
        setPullBoth(damped);
      });
    };

    const onEnd = () => {
      const s = startRef.current;
      startRef.current = null;
      if (!s?.active) return;
      if (pullRef.current >= THRESHOLD) {
        setRefreshing(true);
        setPullBoth(THRESHOLD);
        window.setTimeout(() => window.location.reload(), 420);
      } else {
        setPullBoth(0);
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [refreshing]);

  const visible = pull > 2 || refreshing;
  const ratio = Math.min(1, pull / THRESHOLD);
  const label = refreshing
    ? zh ? "正在刷新…" : "Refreshing…"
    : ratio >= 1
      ? zh ? "松开刷新" : "Release to refresh"
      : zh ? "下拉刷新" : "Pull to refresh";

  return (
    <div
      aria-hidden={!visible}
      className="pointer-events-none fixed inset-x-0 top-0 z-[90] flex justify-center md:hidden"
      style={{
        transform: `translateY(${Math.min(pull, MAX) - 44}px)`,
        opacity: visible ? Math.min(1, pull / 24) : 0,
        transition: pull === 0 ? "transform .28s ease, opacity .2s ease" : "none",
      }}
    >
      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-stroke bg-bg-base/95 px-3.5 py-2 text-[11px] text-ink-muted shadow-card backdrop-blur">
        <Icons.RefreshCw
          size={13}
          className={refreshing ? "animate-spin text-brand-primary" : "text-brand-primary"}
          style={refreshing ? undefined : { transform: `rotate(${ratio * 180}deg)`, transition: "transform .1s linear" }}
        />
        {label}
      </div>
    </div>
  );
}
