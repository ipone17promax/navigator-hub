import { useState } from "react";
import * as Icons from "lucide-react";
import { useUserStore, type CustomCategory, type CustomSite } from "@/stores/useUserStore";
import { CATEGORIES } from "@/config/sites";
import { useI18n } from "@/i18n";
import type { LucideIcon } from "lucide-react";

const icon = (n: string): LucideIcon => (Icons as unknown as Record<string, LucideIcon>)[n] ?? Icons.Globe;

export default function CustomEditor() {
  const { t } = useI18n();
  const customCats = useUserStore((s) => s.customCats);
  const customSites = useUserStore((s) => s.customSites);
  const addCat = useUserStore((s) => s.addCategory);
  const updateCat = useUserStore((s) => s.updateCategory);
  const removeCat = useUserStore((s) => s.removeCategory);
  const addSite = useUserStore((s) => s.addSite);
  const updateSite = useUserStore((s) => s.updateSite);
  const removeSite = useUserStore((s) => s.removeSite);

  const [tab, setTab] = useState<"cat" | "site">("cat");

  // Cat form
  const [editingCat, setEditingCat] = useState<CustomCategory | null>(null);
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("Folder");
  const [catPrivate, setCatPrivate] = useState(false);

  // Site form
  const [editingSite, setEditingSite] = useState<CustomSite | null>(null);
  const [siteName, setSiteName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [siteDesc, setSiteDesc] = useState("");
  const [siteIcon, setSiteIcon] = useState("Globe");
  const [siteCatId, setSiteCatId] = useState<string>(CATEGORIES[1]?.key || "dev");

  const resetCatForm = () => { setEditingCat(null); setCatName(""); setCatIcon("Folder"); setCatPrivate(false); };
  const resetSiteForm = () => { setEditingSite(null); setSiteName(""); setSiteUrl(""); setSiteDesc(""); setSiteIcon("Globe"); setSiteCatId(CATEGORIES[1]?.key || "dev"); };

  const startEditCat = (c: CustomCategory) => {
    setEditingCat(c); setCatName(c.name); setCatIcon(c.iconName); setCatPrivate(!!c.private);
  };
  const startEditSite = (s: CustomSite) => {
    setEditingSite(s); setSiteName(s.name); setSiteUrl(s.url); setSiteDesc(s.desc || ""); setSiteIcon(s.icon || "Globe"); setSiteCatId(s.categoryId);
  };

  const saveCat = () => {
    if (!catName.trim()) return;
    if (editingCat) updateCat(editingCat.id, { name: catName.trim(), iconName: catIcon || "Folder", private: catPrivate });
    else addCat({ name: catName.trim(), iconName: catIcon || "Folder", private: catPrivate });
    resetCatForm();
  };
  const saveSite = () => {
    if (!siteName.trim() || !siteUrl.trim()) return;
    const payload = { name: siteName.trim(), url: siteUrl.trim(), desc: siteDesc.trim(), icon: siteIcon || "Globe", categoryId: siteCatId };
    if (editingSite) updateSite(editingSite.id, payload);
    else addSite(payload);
    resetSiteForm();
  };

  const allCatOptions = [
    ...CATEGORIES.map((c) => ({ id: c.key, name: t.cats[c.key as keyof typeof t.cats] ?? c.label })),
    ...customCats.map((c) => ({ id: c.id, name: c.name })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setTab("cat")}
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
            tab === "cat" ? "bg-brand-gradient text-white shadow-glow" : "border border-stroke text-ink-muted hover:bg-white/5"
          }`}>{t.custom.addCat}</button>
        <button onClick={() => setTab("site")}
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
            tab === "site" ? "bg-brand-gradient text-white shadow-glow" : "border border-stroke text-ink-muted hover:bg-white/5"
          }`}>{t.custom.addSite}</button>
      </div>

      {tab === "cat" && (
        <div className="space-y-4">
          <div className="space-y-2 rounded-xl border border-stroke bg-bg-elevate/40 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="w-20 text-xs text-ink-subtle">{t.custom.catName}</label>
              <input value={catName} onChange={(e) => setCatName(e.target.value)}
                className="flex-1 rounded-lg border border-stroke bg-bg-base px-3 py-1.5 text-sm text-ink outline-none focus:border-brand-primary" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="w-20 text-xs text-ink-subtle">{t.custom.catIcon}</label>
              <input value={catIcon} onChange={(e) => setCatIcon(e.target.value)}
                className="flex-1 rounded-lg border border-stroke bg-bg-base px-3 py-1.5 font-mono text-sm text-ink outline-none focus:border-brand-primary" />
              {icon(catIcon) && (() => { const I = icon(catIcon); return <I size={16} className="text-brand-primary" />; })()}
            </div>
            <label className="flex items-center gap-2 text-xs text-ink-muted">
              <input type="checkbox" checked={catPrivate} onChange={(e) => setCatPrivate(e.target.checked)}
                className="h-4 w-4 accent-cyan-400" />
              {t.custom.catPrivate}
            </label>
            <div className="flex gap-2">
              <button onClick={saveCat} className="inline-flex items-center gap-1 rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white shadow-glow">
                <Icons.Save size={14} /> {t.save}
              </button>
              {editingCat && (
                <button onClick={resetCatForm} className="inline-flex items-center gap-1 rounded-lg border border-stroke px-3 py-1.5 text-xs text-ink-muted hover:bg-white/5">
                  {t.cancel}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            {customCats.length === 0 && <p className="text-xs text-ink-muted">—</p>}
            {customCats.map((c) => {
              const I = icon(c.iconName);
              return (
                <div key={c.id} className="flex items-center gap-2 rounded-lg border border-stroke bg-bg-elevate/40 px-3 py-2">
                  <I size={16} className={c.private ? "text-pink-400" : "text-brand-primary"} />
                  <div className="flex-1 truncate text-sm text-ink">
                    {c.name} {c.private && <Icons.Lock size={12} className="ml-1 inline text-pink-400" />}
                  </div>
                  <button onClick={() => startEditCat(c)} className="rounded-md p-1 text-ink-muted hover:bg-white/5 hover:text-ink">
                    <Icons.Pencil size={14} />
                  </button>
                  <button onClick={() => confirm(t.custom.confirmDel) && removeCat(c.id)}
                    className="rounded-md p-1 text-ink-muted hover:bg-red-500/10 hover:text-red-400">
                    <Icons.Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "site" && (
        <div className="space-y-4">
          <div className="space-y-2 rounded-xl border border-stroke bg-bg-elevate/40 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="w-20 text-xs text-ink-subtle">{t.custom.siteName}</label>
              <input value={siteName} onChange={(e) => setSiteName(e.target.value)}
                className="flex-1 rounded-lg border border-stroke bg-bg-base px-3 py-1.5 text-sm text-ink outline-none focus:border-brand-primary" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="w-20 text-xs text-ink-subtle">{t.custom.siteUrl}</label>
              <input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} placeholder="https://"
                className="flex-1 rounded-lg border border-stroke bg-bg-base px-3 py-1.5 text-sm text-ink outline-none focus:border-brand-primary" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="w-20 text-xs text-ink-subtle">{t.custom.siteDesc}</label>
              <input value={siteDesc} onChange={(e) => setSiteDesc(e.target.value)}
                className="flex-1 rounded-lg border border-stroke bg-bg-base px-3 py-1.5 text-sm text-ink outline-none focus:border-brand-primary" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="w-20 text-xs text-ink-subtle">{t.custom.catIcon}</label>
              <input value={siteIcon} onChange={(e) => setSiteIcon(e.target.value)}
                className="flex-1 rounded-lg border border-stroke bg-bg-base px-3 py-1.5 font-mono text-sm text-ink outline-none focus:border-brand-primary" />
              {icon(siteIcon) && (() => { const I = icon(siteIcon); return <I size={16} className="text-brand-primary" />; })()}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="w-20 text-xs text-ink-subtle">{t.custom.siteCat}</label>
              <select value={siteCatId} onChange={(e) => setSiteCatId(e.target.value as any)}
                className="flex-1 rounded-lg border border-stroke bg-bg-base px-3 py-1.5 text-sm text-ink outline-none focus:border-brand-primary">
                {allCatOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={saveSite} className="inline-flex items-center gap-1 rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white shadow-glow">
                <Icons.Save size={14} /> {t.save}
              </button>
              {editingSite && (
                <button onClick={resetSiteForm} className="inline-flex items-center gap-1 rounded-lg border border-stroke px-3 py-1.5 text-xs text-ink-muted hover:bg-white/5">
                  {t.cancel}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {customSites.length === 0 && <p className="text-xs text-ink-muted">—</p>}
            {customSites.map((s) => {
              const I = icon(s.icon || "Globe");
              const cat = allCatOptions.find((c) => c.id === s.categoryId);
              return (
                <div key={s.id} className="flex items-center gap-2 rounded-lg border border-stroke bg-bg-elevate/40 px-3 py-2">
                  <I size={16} className="text-brand-primary" />
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate text-sm text-ink">{s.name}</div>
                    <div className="truncate text-[11px] text-ink-subtle">{cat?.name || "?"} · {s.url}</div>
                  </div>
                  <button onClick={() => startEditSite(s)} className="rounded-md p-1 text-ink-muted hover:bg-white/5 hover:text-ink">
                    <Icons.Pencil size={14} />
                  </button>
                  <button onClick={() => confirm(t.custom.confirmDel) && removeSite(s.id)}
                    className="rounded-md p-1 text-ink-muted hover:bg-red-500/10 hover:text-red-400">
                    <Icons.Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
