import { useMemo } from "react";
import * as Icons from "lucide-react";
import { CATEGORIES } from "@/config/sites";
import { useAppStore } from "@/stores/useAppStore";
import { useI18n } from "@/i18n";
import { useUserStore } from "@/stores/useUserStore";
import type { LucideIcon } from "lucide-react";

const catIconMap: Record<string, string> = {
  all: "LayoutGrid", search: "Search", dev: "Code2", ai: "Bot",
  design: "Palette", social: "MessageCircle", video: "Video",
  learn: "BookOpen", office: "Briefcase", weather: "CloudSun", tools: "Wrench",
};

const icon = (n: string): LucideIcon => (Icons as unknown as Record<string, LucideIcon>)[n] ?? Icons.Globe;

interface Props {
  onOpenEdit?: () => void;
}

export default function CategoryTabs({ onOpenEdit }: Props) {
  const active = useAppStore((s) => s.activeCategoryId);
  const setActive = useAppStore((s) => s.setActiveCategoryId);
  const { t } = useI18n();
  const customCats = useUserStore((s) => s.customCats);
  const unlocked = useUserStore((s) => s.privateUnlocked);

  const allCats = useMemo(() => {
    type Cat = { id: string; name: string; iconName: string; private?: boolean };
    const built: Cat[] = CATEGORIES.map((c) => ({
      id: c.key, name: t.cats[c.key as keyof typeof t.cats] ?? c.label, iconName: catIconMap[c.key] || "Folder",
    }));
    const cus: Cat[] = customCats.map((c) => ({
      id: c.id, name: c.name, iconName: c.iconName, private: c.private,
    }));
    return [...built, ...cus];
  }, [t, customCats]);

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <div className="no-scrollbar flex items-end gap-2 overflow-x-auto pb-2" role="tablist">
        {allCats.map((c, i) => {
          const I = icon(c.iconName);
          const isActive = active === c.id;
          const isPrivate = c.private && !unlocked;
          return (
            <button
              key={c.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(c.id)}
              style={{ animation: `fadeInUp .4s ${i * 40}ms both` }}
              className={`group relative shrink-0 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-300 ${
                isActive
                  ? "border-transparent bg-brand-gradient text-white shadow-glow -translate-y-0.5"
                  : "border-stroke bg-bg-elevate/40 text-ink-muted hover:border-stroke-hover hover:text-ink hover:-translate-y-0.5"
              } ${isPrivate ? "opacity-50 grayscale" : ""}`}
              title={isPrivate ? t.user.guestHint : c.name}
            >
              <I size={16} />
              <span>{c.name}</span>
              {c.private && <Icons.Lock size={12} className={unlocked ? "text-emerald-300" : "text-rose-300"} />}
            </button>
          );
        })}

        {onOpenEdit && (
          <button
            onClick={onOpenEdit}
            className="ml-auto shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-stroke px-3 py-2 text-sm text-ink-muted transition-all hover:border-brand-primary hover:text-ink hover:bg-white/5"
            title={t.custom.title}
          >
            <Icons.Settings2 size={14} />
            <span className="hidden sm:inline">{t.custom.title}</span>
          </button>
        )}
      </div>
    </div>
  );
}
