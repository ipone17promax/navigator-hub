/**
 * 把非关键任务推迟到浏览器空闲期执行
 * - 首屏关键渲染（React 挂载、布局、绘制）完成后，再发起第三方数据请求
 * - 支持 requestIdleCallback 的环境用它（带 timeout 兜底）；不支持时退化为短延时
 */
export function deferIdle(cb: () => void, timeout = 1600): void {
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  };
  if (typeof w.requestIdleCallback === "function") {
    w.requestIdleCallback(() => cb(), { timeout });
    return;
  }
  window.setTimeout(cb, Math.min(800, timeout));
}