import { useRef, useState } from "react";
import * as Icons from "lucide-react";
import { useUserStore } from "@/stores/useUserStore";
import { useI18n } from "@/i18n";

export default function DataSync() {
  const { t } = useI18n();
  const store = useUserStore();
  const [paste, setPaste] = useState("");
  const [tip, setTip] = useState<string>("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  const doExport = () => {
    const raw = store.exportJSON();
    navigator.clipboard?.writeText(raw).then(
      () => setTip(t.sync.copied),
      () => {
        taRef.current?.focus();
        taRef.current?.select();
      },
    );
    setTimeout(() => setTip(""), 2000);
  };

  const doImport = () => {
    if (!paste.trim()) return;
    const ok = store.importJSON(paste);
    setTip(ok ? t.sync.ok : t.sync.fail);
    if (ok) setPaste("");
    setTimeout(() => setTip(""), 2500);
  };

  const doWipe = () => {
    if (!confirm(t.sync.confirmReset)) return;
    store.wipe();
    setTip("OK");
    setTimeout(() => setTip(""), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={doExport}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-glow transition-all hover:-translate-y-0.5">
          <Icons.Download size={16} /> {t.sync.export}
        </button>
        <button onClick={doImport}
          className="inline-flex items-center gap-2 rounded-xl border border-stroke bg-bg-elevate px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-white/5">
          <Icons.Upload size={16} /> {t.sync.import}
        </button>
        <button onClick={doWipe}
          className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/10">
          <Icons.Trash2 size={16} /> {t.sync.reset}
        </button>
        {tip && <span className="self-center text-xs text-emerald-400">{tip}</span>}
      </div>
      <div>
        <p className="mb-1 text-xs font-semibold text-ink-subtle uppercase tracking-widest">{t.sync.paste}</p>
        <textarea ref={taRef} value={paste} onChange={(e) => setPaste(e.target.value)}
          placeholder='{"v":3,...}'
          className="h-32 w-full resize-none rounded-xl border border-stroke bg-bg-elevate/60 p-3 font-mono text-xs text-ink outline-none transition-colors focus:border-brand-primary"
        />
      </div>
    </div>
  );
}
