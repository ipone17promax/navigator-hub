import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AppState {
  keyword: string;
  activeEngineId: string;
  activeCategoryId: string;
  commandPaletteOpen: boolean;
  elderlyMode: boolean;
  toggleElderlyMode: () => void;
  setKeyword: (kw: string) => void;
  setActiveEngineId: (id: string) => void;
  setActiveCategoryId: (id: string) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      keyword: "",
      activeEngineId: "google",
      activeCategoryId: "all",
      commandPaletteOpen: false,
      elderlyMode: false,
      toggleElderlyMode: () => set((s) => ({ elderlyMode: !s.elderlyMode })),
      setKeyword: (kw) => set({ keyword: kw }),
      setActiveEngineId: (id) => set({ activeEngineId: id }),
      setActiveCategoryId: (id) => set({ activeCategoryId: id }),
      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),
      toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
    }),
    { name: "nh.app.v3", partialize: (s) => ({ activeEngineId: s.activeEngineId, activeCategoryId: s.activeCategoryId, elderlyMode: s.elderlyMode }) },
  ),
);
