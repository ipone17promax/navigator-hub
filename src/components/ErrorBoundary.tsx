import React from "react";

/**
 * 全局错误边界：任何渲染期异常都不再导致整页白屏。
 * 提供「重新加载」与「导出本地数据后重置」两条现场自救路径。
 */

interface State {
  error: Error | null;
}

const isZh = () => (typeof localStorage !== "undefined" ? (localStorage.getItem("nh.locale") || "zh") : "zh") === "zh";

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // 同时打到控制台，便于用户在反馈时贴出
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  private reload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  private exportAndReset = () => {
    try {
      const payload: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("nh.")) payload[k] = localStorage.getItem(k) || "";
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `navigator-hub-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      /* 导出失败不阻塞重置 */
    }
    Object.keys(localStorage)
      .filter((k) => k.startsWith("nh."))
      .forEach((k) => localStorage.removeItem(k));
    this.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    const zh = isZh();
    return (
      <div className="cyber-bg flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-stroke bg-bg-elevate/80 p-6 text-center backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-2xl">
            ⚠️
          </div>
          <h1 className="text-lg font-semibold text-ink">
            {zh ? "页面遇到了一点问题" : "Something went wrong"}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            {zh
              ? "数据仍保存在本机，重新加载即可恢复。若反复出现，可先备份再重置本地缓存。"
              : "Your data is still on this device. Reload to recover, or back up and reset local cache."}
          </p>
          <pre className="mt-3 max-h-24 overflow-auto rounded-lg bg-black/30 p-2 text-left text-[11px] leading-relaxed text-ink-subtle">
            {this.state.error.message}
          </pre>
          <div className="mt-5 flex gap-2">
            <button
              onClick={this.reload}
              className="flex-1 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-glow"
            >
              {zh ? "重新加载" : "Reload"}
            </button>
            <button
              onClick={this.exportAndReset}
              className="flex-1 rounded-xl border border-stroke px-4 py-2.5 text-sm font-medium text-ink-muted hover:bg-white/5"
            >
              {zh ? "备份并重置" : "Backup & reset"}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
