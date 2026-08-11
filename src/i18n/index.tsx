import { createContext, useContext, useCallback, type ReactNode } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { translations, type Locale, type TranslationKeys } from "./translations";

// ============================================================
// i18n Context
// ============================================================
type I18nContextValue = TranslationKeys & {
  locale: Locale;
  t: TranslationKeys;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useAppStore((s) => s.locale);

  const t = translations[locale];

  return (
    <I18nContext.Provider value={{ ...t, locale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

/** 非组件场景下直接取翻译（响应 locale 变化需在组件内调用） */
export function useT() {
  return useI18n().t;
}
