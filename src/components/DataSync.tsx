import { useRef, useState } from "react";
import * as Icons from "@/lib/iconRegistry";
import qrcode from "qrcode-generator";
import { useUserStore } from "@/stores/useUserStore";
import { useI18n } from "@/i18n";
import { decodeSync, encodeSync, extractSyncCode } from "@/lib/syncCode";
import {
  downloadFromGist,
  getGistId,
  getGistToken,
  setGistId,
  setGistToken,
  uploadToGist,
  type GistPayload,
} from "@/lib/gistSync";

/** 只同步“个人资产”，不带访问统计与健康缓存，控制体积（二维码 / Gist 共用） */
function buildPayload(): GistPayload {
  const s = useUserStore.getState();
  return {
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
}

export default function DataSync() {
  const { t } = useI18n();
  const store = useUserStore();
  const [paste, setPaste] = useState("");
  const [tip, setTip] = useState<string>("");
  const [qr, setQr] = useState<{ svg: string; url: string; size: number } | null>(null);
  const [qrErr, setQrErr] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  // --- 云同步（GitHub Gist）状态 ---
  const [token, setToken] = useState<string>(getGistToken);
  const [gistInput, setGistInput] = useState<string>(getGistId);
  const [gistUrl, setGistUrl] = useState<string>(() => {
    const id = getGistId();
    return id ? `https://gist.github.com/${id}` : "";
  });
  const [busy, setBusy] = useState<"" | "up" | "down">("");

  const flash = (msg: string, ms = 2200) => {
    setTip(msg);
    setTimeout(() => setTip(""), ms);
  };

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
      const code = await encodeSync(buildPayload());
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

  const saveToken = () => {
    const v = token.trim();
    if (!v) return;
    setGistToken(v);
    flash(t.ok);
  };

  const clearToken = () => {
    setGistToken("");
    setToken("");
    flash(t.gist.clear);
  };

  const doUpload = async () => {
    const v = token.trim();
    if (!v) return flash(t.gist.noToken);
    setBusy("up");
    try {
      const r = await uploadToGist(v, buildPayload());
      setGistId(r.id);
      setGistInput(r.id);
      setGistUrl(r.url);
      flash(t.gist.upOk, 3000);
    } catch (e) {
      flash(`${t.gist.fail} · ${e instanceof Error ? e.message : String(e)}`, 4000);
    } finally {
      setBusy("");
    }
  };

  const doDownload = async () => {
    setBusy("down");
    try {
      const data = await downloadFromGist(gistInput.trim(), token.trim());
      const ok = store.importJSON(JSON.stringify(data));
      flash(ok ? t.gist.downOk : t.sync.fail, 3000);
    } catch (e) {
      flash(`${t.gist.fail} · ${e instanceof Error ? e.message : String(e)}`, 4000);
    } finally {
      setBusy("");
    }
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

      {/* ===== 云同步：GitHub Gist（用户自带令牌，数据存进用户自己的私密 Gist） ===== */}
      <div className="rounded-2xl border border-stroke bg-bg-elevate/40 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Icons.CloudCog size={15} className="text-brand-primary" />
          <p className="text-sm font-semibold text-ink">{t.gist.title}</p>
        </div>
        <p className="mb-3 text-[11px] leading-relaxed text-ink-subtle">{t.gist.hint}</p>

        <label className="mb-1 block text-[11px] font-medium text-ink-subtle">{t.gist.token}</label>
        <div className="flex gap-2">
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={t.gist.tokenPh}
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-xl border border-stroke bg-bg-base/60 px-3 py-2 font-mono text-xs text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand-primary"
          />
          <button onClick={saveToken}
            className="shrink-0 rounded-xl border border-stroke px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-white/5">
            {t.gist.save}
          </button>
          {token && (
            <button onClick={clearToken}
              className="shrink-0 rounded-xl border border-red-500/30 px-3 py-2 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/10">
              {t.gist.clear}
            </button>
          )}
        </div>

        <label className="mb-1 mt-3 block text-[11px] font-medium text-ink-subtle">Gist ID</label>
        <input
          value={gistInput}
          onChange={(e) => setGistInput(e.target.value)}
          placeholder={t.gist.idPh}
          spellCheck={false}
          className="w-full rounded-xl border border-stroke bg-bg-base/60 px-3 py-2 font-mono text-xs text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand-primary"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={doUpload} disabled={busy !== ""}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-glow transition-all hover:-translate-y-0.5 disabled:opacity-60">
            <Icons.Upload size={15} /> {busy === "up" ? "…" : t.gist.upload}
          </button>
          <button onClick={doDownload} disabled={busy !== ""}
            className="inline-flex items-center gap-2 rounded-xl border border-stroke bg-bg-elevate px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-white/5 disabled:opacity-60">
            <Icons.Download size={15} /> {busy === "down" ? "…" : t.gist.download}
          </button>
          {gistUrl && (
            <a href={gistUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 self-center text-xs text-brand-primary hover:underline">
              <Icons.ExternalLink size={12} /> {t.gist.open}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
