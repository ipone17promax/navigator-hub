import { useI18n } from "@/i18n";
import * as Icons from "lucide-react";
import { useUserStore } from "@/stores/useUserStore";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

export default function ThemeSwitcher() {
  const { t, theme, setTheme, accent, setAccent, toggle, locale } = useI18n();
  const layout = useUserStore((s) => s.layout);
  const setLayout = useUserStore((s) => s.setLayout);
  const pwdHash = useUserStore((s) => s.privatePwdHash);
  const setPwd = useUserStore((s) => s.setPrivatePwd);
  const unlock = useUserStore((s) => s.unlockPrivate);
  const lock = useUserStore((s) => s.lockPrivate);
  const unlocked = useUserStore((s) => s.privateUnlocked);

  const [oldP, setOldP] = useState("");
  const [newP, setNewP] = useState("");
  const [conP, setConP] = useState("");
  const [err, setErr] = useState("");

  const submitPwd = () => {
    if (pwdHash && !unlock(oldP)) { setErr(t.privacy.wrong); return; }
    if (!newP) { setErr(t.privacy.empty); return; }
    if (newP !== conP) { setErr(t.privacy.mismatch); return; }
    setPwd(newP); setErr(""); setOldP(""); setNewP(""); setConP("");
  };

  const accents: { id: string; key: keyof ReturnType<typeof useI18n>["t"]["theme"]; color: string; icon: LucideIcon }[] = [
    { id: "cyan",   key: "cyan",   color: "#22d3ee", icon: Icons.Droplets },
    { id: "purple", key: "purple", color: "#a78bfa", icon: Icons.Gem },
    { id: "pink",   key: "pink",   color: "#f472b6", icon: Icons.Heart },
    { id: "orange", key: "orange", color: "#fb923c", icon: Icons.Flame },
    { id: "green",  key: "green",  color: "#34d399", icon: Icons.Leaf },
    { id: "mono",   key: "mono",   color: "#94a3b8", icon: Icons.Circle },
  ];
  const layouts: { id: "comfy" | "compact" | "large"; key: keyof ReturnType<typeof useI18n>["t"]["layout"]; icon: LucideIcon }[] = [
    { id: "comfy",   key: "comfy",   icon: Icons.LayoutGrid },
    { id: "compact", key: "compact", icon: Icons.LayoutList },
    { id: "large",   key: "large",   icon: Icons.LayoutDashboard },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold text-ink-subtle uppercase tracking-widest">{t.theme.title}</p>
        <div className="grid grid-cols-3 gap-2">
          {(["dark", "light", "system"] as const).map((m) => (
            <button key={m} onClick={() => setTheme(m)}
              className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition-all ${
                theme === m ? "border-brand-primary bg-white/5 shadow-glow" : "border-stroke hover:bg-white/5"
              }`}>
              {m === "dark" && <Icons.Moon size={16} className="text-ink" />}
              {m === "light" && <Icons.Sun size={16} className="text-ink" />}
              {m === "system" && <Icons.Monitor size={16} className="text-ink" />}
              <span className="text-xs font-medium text-ink-muted">{t.theme[m]}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-ink-subtle uppercase tracking-widest">{t.theme.accent}</p>
        <div className="grid grid-cols-6 gap-2">
          {accents.map((a) => {
            const I = a.icon ?? Icons.Droplets;
            const active = accent === a.id;
            return (
              <button key={a.id} onClick={() => setAccent(a.id)}
                className={`aspect-square rounded-xl border transition-all ${
                  active ? "border-white/80 scale-105 shadow-glow" : "border-stroke hover:scale-105"
                }`}
                style={{ background: `radial-gradient(circle at 30% 30%, ${a.color}55, transparent 60%), #0f172a` }}
                title={t.theme[a.key]}>
                <div className="flex h-full w-full items-center justify-center"><I size={16} style={{ color: a.color }} /></div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-ink-subtle uppercase tracking-widest">{t.layout.title}</p>
        <div className="grid grid-cols-3 gap-2">
          {layouts.map((l) => {
            const I = l.icon ?? Icons.LayoutGrid;
            const active = layout === l.id;
            return (
              <button key={l.id} onClick={() => setLayout(l.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition-all ${
                  active ? "border-brand-primary bg-white/5 shadow-glow" : "border-stroke hover:bg-white/5"
                }`}>
                <I size={16} className="text-ink" />
                <span className="text-xs font-medium text-ink-muted">{t.layout[l.key]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-ink-subtle uppercase tracking-widest">{t.language}</p>
        <button onClick={toggle}
          className="flex w-full items-center justify-between rounded-xl border border-stroke bg-bg-elevate/40 px-4 py-2.5 text-sm text-ink transition-colors hover:bg-white/5">
          <span className="flex items-center gap-2"><Icons.Languages size={16} className="text-brand-primary" /> {t.lang}</span>
          <span className="text-ink-muted">{locale === "zh" ? "→ English" : "→ 中文"}</span>
        </button>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-ink-subtle uppercase tracking-widest">{t.privacy.setPwd}</p>
          {pwdHash && (
            unlocked
              ? <button onClick={lock} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-400 hover:bg-emerald-500/20">
                  <Icons.Unlock size={12} /> {t.privacy.unlocked}
                </button>
              : <span className="inline-flex items-center gap-1 rounded-lg bg-rose-500/10 px-2 py-0.5 text-[11px] text-rose-400">
                  <Icons.Lock size={12} /> {t.privacy.locked}
                </span>
          )}
        </div>
        {pwdHash && (
          <input value={oldP} onChange={(e) => setOldP(e.target.value)} type="password" placeholder={t.privacy.oldPwd}
            className="mb-2 w-full rounded-lg border border-stroke bg-bg-base px-3 py-1.5 text-sm text-ink outline-none focus:border-brand-primary" />
        )}
        <input value={newP} onChange={(e) => setNewP(e.target.value)} type="password" placeholder={t.privacy.newPwd}
          className="mb-2 w-full rounded-lg border border-stroke bg-bg-base px-3 py-1.5 text-sm text-ink outline-none focus:border-brand-primary" />
        <input value={conP} onChange={(e) => setConP(e.target.value)} type="password" placeholder={t.privacy.confirmPwd}
          className="mb-2 w-full rounded-lg border border-stroke bg-bg-base px-3 py-1.5 text-sm text-ink outline-none focus:border-brand-primary" />
        {err && <p className="mb-2 text-xs text-rose-400">{err}</p>}
        <button onClick={submitPwd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white shadow-glow">
          <Icons.Save size={14} /> {t.save}
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-ink-subtle uppercase tracking-widest">{t.shortcut.title}</p>
        <div className="space-y-1.5 text-xs text-ink-muted">
          <div className="flex justify-between"><span>{t.shortcut.toggleCmd}</span><kbd className="rounded border border-stroke bg-white/5 px-1.5 font-mono">Cmd+K</kbd></div>
          <div className="flex justify-between"><span>{t.shortcut.focusSearch}</span><kbd className="rounded border border-stroke bg-white/5 px-1.5 font-mono">/</kbd></div>
          <div className="flex justify-between"><span>{t.shortcut.switchLang}</span><kbd className="rounded border border-stroke bg-white/5 px-1.5 font-mono">L</kbd></div>
          <div className="flex justify-between"><span>{t.shortcut.switchTheme}</span><kbd className="rounded border border-stroke bg-white/5 px-1.5 font-mono">T</kbd></div>
          <div className="flex justify-between"><span>{t.shortcut.hint1} 1~9</span><span className="text-ink-subtle">{t.shortcut.hint2}</span></div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-ink-subtle uppercase tracking-widest">{t.newtab.title}</p>
        <div className="space-y-1.5 text-xs text-ink-muted">
          <div className="flex items-center gap-2 rounded-lg border border-stroke bg-bg-base px-3 py-2">
            <code className="flex-1 truncate font-mono text-[11px] text-ink">{location.href}</code>
            <button onClick={() => navigator.clipboard?.writeText(location.href)}
              className="rounded border border-stroke px-2 py-0.5 hover:bg-white/5">
              <Icons.Copy size={12} />
            </button>
          </div>
          <p>{t.newtab.step1}</p><p>{t.newtab.step2}</p>
        </div>
      </div>
    </div>
  );
}
