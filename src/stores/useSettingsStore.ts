import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SettingsState {
  preset: string;
  opacity: number;
  customImage: string;
  setPreset: (p: string) => void;
  setOpacity: (o: number) => void;
  setCustomImage: (s: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      preset: "starfield",
      opacity: 0.85,
      customImage: "",
      setPreset: (p) => set({ preset: p }),
      setOpacity: (o) => set({ opacity: o }),
      setCustomImage: (s) => set({ customImage: s }),
    }),
    { name: "nh.bg" },
  ),
);
