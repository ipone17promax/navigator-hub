import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CustomSite {
  id: string;
  name: string;
  url: string;
  desc?: string;
  icon?: string;
  categoryId: string;
}

export interface CustomCategory {
  id: string;
  name: string;
  iconName: string;
  order: number;
  private?: boolean;
}

export type LayoutMode = "comfy" | "compact" | "large";
export type HealthStatus = "unknown" | "ok" | "warn" | "err";

export interface SiteVisitStat {
  siteId: string;
  siteName: string;
  url: string;
  categoryId: string;
  count: number;
  lastAt: number;
}

export interface HealthInfo {
  [siteId: string]: { status: HealthStatus; lastCheck: number; responseMs?: number };
}

export interface UserState {
  favorites: string[];                         // siteId[]
  favoriteOrder: string[];                     // 拖拽重排
  visits: SiteVisitStat[];                     // 统计
  customCats: CustomCategory[];                // 自定义分类
  customSites: CustomSite[];                   // 自定义站点
  categoryOrder: string[];                     // 分类排序 id
  layout: LayoutMode;
  privatePwdHash: string;                      // 隐私密码（简易 hash）
  privateUnlocked: boolean;                    // 本次会话解锁状态
  health: HealthInfo;                          // 站点健康
  setFavorites: (f: string[]) => void;
  toggleFavorite: (siteId: string) => void;
  reorderFavorites: (order: string[]) => void;
  recordVisit: (s: Omit<SiteVisitStat, "count" | "lastAt"> & { count?: number; lastAt?: number }) => void;
  clearStats: () => void;
  addCategory: (c: Omit<CustomCategory, "id" | "order"> & { id?: string }) => void;
  updateCategory: (id: string, patch: Partial<CustomCategory>) => void;
  removeCategory: (id: string) => void;
  addSite: (s: Omit<CustomSite, "id"> & { id?: string }) => void;
  updateSite: (id: string, patch: Partial<CustomSite>) => void;
  removeSite: (id: string) => void;
  reorderCategories: (ids: string[]) => void;
  setLayout: (l: LayoutMode) => void;
  setPrivatePwd: (pwd: string) => void;
  unlockPrivate: (pwd: string) => boolean;
  lockPrivate: () => void;
  patchHealth: (patch: HealthInfo) => void;
  wipe: () => void;
  exportJSON: () => string;
  importJSON: (raw: string) => boolean;
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return "p" + Math.abs(h).toString(36);
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      favorites: [],
      favoriteOrder: [],
      visits: [],
      customCats: [],
      customSites: [],
      categoryOrder: [],
      layout: "comfy",
      privatePwdHash: "",
      privateUnlocked: false,
      health: {},
      setFavorites: (f) => set({ favorites: f, favoriteOrder: f }),
      toggleFavorite: (id) => set((s) => {
        const inFav = s.favorites.includes(id);
        const favorites = inFav ? s.favorites.filter((x) => x !== id) : [...s.favorites, id];
        return { favorites, favoriteOrder: favorites };
      }),
      reorderFavorites: (order) => set({ favoriteOrder: order }),
      recordVisit: (v) => set((s) => {
        const idx = s.visits.findIndex((x) => x.siteId === v.siteId);
        const visits = s.visits.slice();
        if (idx >= 0) {
          visits[idx] = { ...visits[idx], count: visits[idx].count + 1, lastAt: Date.now() };
        } else {
          visits.push({ ...v, count: 1, lastAt: Date.now() });
        }
        return { visits };
      }),
      clearStats: () => set({ visits: [], health: {} }),
      addCategory: (c) => set((s) => ({
        customCats: [...s.customCats, { ...c, id: c.id || "cat_" + Math.random().toString(36).slice(2, 8), order: s.customCats.length }],
      })),
      updateCategory: (id, patch) => set((s) => ({
        customCats: s.customCats.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      })),
      removeCategory: (id) => set((s) => ({
        customCats: s.customCats.filter((x) => x.id !== id),
        customSites: s.customSites.filter((x) => x.categoryId !== id),
        categoryOrder: s.categoryOrder.filter((x) => x !== id),
      })),
      addSite: (site) => set((s) => ({
        customSites: [...s.customSites, { ...site, id: site.id || "st_" + Math.random().toString(36).slice(2, 10) }],
      })),
      updateSite: (id, patch) => set((s) => ({
        customSites: s.customSites.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      })),
      removeSite: (id) => set((s) => ({
        customSites: s.customSites.filter((x) => x.id !== id),
        favorites: s.favorites.filter((x) => x !== id),
      })),
      reorderCategories: (ids) => set({ categoryOrder: ids }),
      setLayout: (layout) => set({ layout }),
      setPrivatePwd: (pwd) => set({ privatePwdHash: simpleHash(pwd) }),
      unlockPrivate: (pwd) => {
        const ok = simpleHash(pwd) === get().privatePwdHash;
        if (ok) set({ privateUnlocked: true });
        return ok;
      },
      lockPrivate: () => set({ privateUnlocked: false }),
      patchHealth: (patch) => set((s) => ({ health: { ...s.health, ...patch } })),
      wipe: () => set({
        favorites: [], favoriteOrder: [], visits: [], customCats: [], customSites: [],
        categoryOrder: [], layout: "comfy", privatePwdHash: "", privateUnlocked: false, health: {},
      }),
      exportJSON: () => {
        const { favorites, favoriteOrder, visits, customCats, customSites, categoryOrder, layout, privatePwdHash, health } = get();
        return JSON.stringify({ v: 3, favorites, favoriteOrder, visits, customCats, customSites, categoryOrder, layout, privatePwdHash, health }, null, 2);
      },
      importJSON: (raw) => {
        try {
          const d = JSON.parse(raw);
          if (!d || typeof d !== "object") return false;
          set({
            favorites: Array.isArray(d.favorites) ? d.favorites : [],
            favoriteOrder: Array.isArray(d.favoriteOrder) ? d.favoriteOrder : d.favorites ?? [],
            visits: Array.isArray(d.visits) ? d.visits : [],
            customCats: Array.isArray(d.customCats) ? d.customCats : [],
            customSites: Array.isArray(d.customSites) ? d.customSites : [],
            categoryOrder: Array.isArray(d.categoryOrder) ? d.categoryOrder : [],
            layout: ["comfy", "compact", "large"].includes(d.layout) ? d.layout : "comfy",
            privatePwdHash: typeof d.privatePwdHash === "string" ? d.privatePwdHash : "",
            health: d.health && typeof d.health === "object" ? d.health : {},
            privateUnlocked: false,
          });
          return true;
        } catch {
          return false;
        }
      },
    }),
    { name: "nh.user.v3" },
  ),
);
