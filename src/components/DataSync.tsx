import { useRef, useState } from "react";
import * as Icons from "lucide-react";
import qrcode from "qrcode-generator";
import { useUserStore } from "@/stores/useUserStore";
import { useI18n } from "@/i18n";
import { decodeSync, encodeSync, extractSyncCode } from "@/lib/syncCode";

export default function DataSync() {
  const { t } = useI18n();
  const store = useUserStore();
  const [paste, setPaste] = useState("");
  const [tip, setTip] = useState<string>("");
  const [qr, setQr] = useState<{ svg: string; url: string; size: number } | null>(null);
  const [qrErr, setQrErr] = useState("");
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

  const doShare = async () => {
    setQrErr("");
    setQr(null);
    try {
      const s = useUserStore.getState();
      // 只同步“个人资产”，不带访问统计与健康缓存，控制二维码体积
      const payload = {
        v: 3,
        favorites: s.favorites,
        favoriteOrder: s.favoriteOrder,
        visits: [],
        customCats: s.customCats,
        customSites: s.customSites,
        categoryOrder: s.categoryOrder,
        layout: s.layout,
        privatePwdHash: s.privatePwdHash,
        health: {},
      };
      const code = await encodeSync(payload);
      const url = `${location.origin}${location.pathname}?sync=${code}`;
      try {
        const q = qrcode(0, "L");
        q.addData(url);
        q.make();
        setQr({ svg: q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }), url, size: url.length });
      } catch {
        setQr({ svg: "", url, size: url.length });
        setQrErr(t.sync.tooLong);
      }
    } catch (e) {
      setQrErr(String(e));
    }
  };

  const copyLink = () => {
    if (!qr) return;
    navigator.clipboard?.writeText(qr.url).then(() => {
      setTip(t.sync.copied);
      setTimeout(() => setTip(""), 2000);
    });
  };

  const doImport = async () => {
    if (!paste.trim()) return;
    const code = extractSyncCode(paste);
    try {
      const data = await decodeSync(code);
      const ok = store.importJSON(JSON.stringify(data));
      setTip(ok ? t.sync.ok : t.sync.fail);
      if (ok) setPaste("");
    } catch {
      setTip(t.sync.fail);
    }
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
        <button onClick={doShare}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-glow transition-all hover:-translate-y-0.5">
          <Icons.QrCode size={16} /> {t.sync.share}
        </button>
        <button onClick={doExport}
          className="inline-flex items-center gap-2 rounded-xl border border-stroke bg-bg-elevate px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-white/5">
          <Icons.Download size={16} /> {t.sync.export}
        </button>
        <button onClick={doWipe}
          className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/10">
          <Icons.Trash2 size={16} /> {t.sync.reset}
        </button>
        {tip && <span className="self-center text-xs text-emerald-500">{tip}</span>}
      </div>

      {(qr || qrErr) && (
        <div className="rounded-2xl border border-stroke bg-bg-elevate/60 p-4">
          <p className="mb-3 text-xs text-ink-muted">{t.sync.shareHint}</p>
          {qr?.svg ? (
            <div className="mx-auto w-[220px] rounded-xl bg-white p-3 [&_svg]:h-auto [&_svg]:w-full"
              dangerouslySetInnerHTML={{ __html: qr.svg }} />
          ) : null}
          {qrErr && <p className="mb-2 text-xs text-amber-500">{qrErr}</p>}
          <p className="mt-3 break-all rounded-lg border border-stroke bg-bg-base/60 px-2 py-1.5 font-mono text-[10px] text-ink-subtle">
            {qr?.url.slice(0, 160)}{(qr?.url.length || 0) > 160 ? "…" : ""}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-ink-subtle">{t.sync.scanHint}</span>
            <button onClick={copyLink}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stroke px-2.5 py-1.5 text-xs text-ink transition-colors hover:bg-white/5">
              <Icons.Copy size={12} /> {t.sync.copyLink}
            </button>
          </div>
        </div>
      )}

      <div>
        <p className="mb-1 text-xs font-semibold text-ink-subtle uppercase tracking-widest">{t.sync.importCode}</p>
        <textarea ref={taRef} value={paste} onChange={(e) => setPaste(e.target.value)}
          placeholder="gH4sIA… / https://…?sync=gH4sIA…"
          className="h-24 w-full resize-none rounded-xl border border-stroke bg-bg-elevate/60 p-3 font-mono text-xs text-ink outline-none transition-colors focus:border-brand-primary"
        />
        <button onClick={doImport}
          className="mt-2 inline-flex items-center gap-2 rounded-xl border border-stroke bg-bg-elevate px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-white/5">
          <Icons.Upload size={16} /> {t.sync.import}
        </button>
      </div>
    </div>
  );
}
