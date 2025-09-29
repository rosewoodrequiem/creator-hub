import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { DayKey, DayPlan, WeekPlan } from "../types";
import { DAY_KEYS } from "../utils/date";
// If HybridStorage implements StateStorage correctly, keep using it.
// Otherwise, swap to localStorage for config and handle images separately.
import { HybridStorage } from "./hybridStorage";

const BROWSER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const DEFAULT_DAY: DayPlan = {
  enabled: false,
  gameName: "",
  time: "",
  timezone: BROWSER_TZ,
  logoUrl: undefined,
  graphicUrl: undefined,
};

type TemplateId = "ElegantBlue";

export type ConfigState = {
  test: string;
  week: WeekPlan;
  template: TemplateId;
  heroUrl?: string;
  exportScale: number;
  weekStart: "sun" | "mon";
  weekOffset: number;
  sidebarOpen: boolean;
  setTest: (value: string) => void;
  setTemplate: (t: TemplateId) => void;
  setHeroUrl: (url?: string) => void;
  setExportScale: (scale: number) => void;
  setWeekStart: (start: "sun" | "mon") => void;
  updateWeek: (patch: Partial<WeekPlan>) => void;
  updateDay: (key: DayKey, patch: Partial<DayPlan>) => void;
  setDay: (key: DayKey, next: DayPlan) => void;
  resetDays: () => void;
  toggleSidebar: () => void;
  nextWeek: () => void;
  prevWeek: () => void;
};

const storage = new HybridStorage(); // must implement StateStorage

function makeDefaultWeek(): WeekPlan {
  const today = new Date();
  const iso = today.toISOString().slice(0, 10);
  const days = Object.fromEntries(
    DAY_KEYS.map((k) => [k, { ...DEFAULT_DAY }]),
  ) as Record<DayKey, DayPlan>;
  return { weekAnchorDate: iso, weekStart: "mon", days };
}

export const useConfig = create<ConfigState>()(
  persist(
    (set, get) => ({
      week: makeDefaultWeek(),
      template: "ElegantBlue",
      heroUrl: undefined,
      exportScale: 2,
      weekStart: "mon",
      weekOffset: 0,
      sidebarOpen: true,
      test: "test value",

      setTest: (value) => set({ test: value }),
      setTemplate: (t) => set({ template: t }),
      setHeroUrl: (url) => set({ heroUrl: url }),
      setExportScale: (scale) => set({ exportScale: scale }),
      setWeekStart: (start) => set({ weekStart: start }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      nextWeek: () => set((s) => ({ weekOffset: s.weekOffset + 1 })),
      prevWeek: () => set((s) => ({ weekOffset: s.weekOffset - 1 })),

      updateWeek: (patch) => set((s) => ({ week: { ...s.week, ...patch } })),
      updateDay: (key, patch) =>
        set((s) => ({
          week: {
            ...s.week,
            days: {
              ...s.week.days,
              [key]: { ...s.week.days[key], ...patch },
            },
          },
        })),
      setDay: (key, next) =>
        set((s) => ({
          week: { ...s.week, days: { ...s.week.days, [key]: next } },
        })),
      resetDays: () =>
        set((s) => {
          const fresh = Object.fromEntries(
            DAY_KEYS.map((k) => [k, { ...DEFAULT_DAY }]),
          ) as Record<DayKey, DayPlan>;
          return { week: { ...s.week, days: fresh } };
        }),
    }),
    {
      name: "schedule-maker-config",
      storage: createJSONStorage(() => storage),
      version: 1,

      // Persist only config-y stuff (images stay out / go to IDB separately)
      partialize: (s) => ({
        test: s.test,
        week: s.week,
        template: s.template,
        heroUrl: s.heroUrl,
        exportScale: s.exportScale,
        weekStart: s.weekStart,
        weekOffset: s.weekOffset,
        sidebarOpen: s.sidebarOpen,
      }),

      // Do your deep merge here (use ?? not ||)
      merge: (persisted, current) => {
        const p = persisted as Partial<ConfigState> | undefined;
        if (!p) return current;

        return {
          ...current,
          ...p,
          heroUrl: p.heroUrl ?? current.heroUrl,
          template: p.template ?? current.template,
          exportScale: p.exportScale ?? current.exportScale,
          weekStart: p.weekStart ?? current.weekStart,
          week: {
            ...current.week,
            ...(p.week ?? {}),
            days: {
              ...current.week.days,
              ...(p.week?.days ?? {}),
            },
          },
        };
      },

      // Optional: useful for logging, but don’t set state here
      onRehydrateStorage: () => (state, err) => {
        if (err) console.error("rehydrate error", err);
        // You can log but avoid setState here.
        console.log("hydrated", state);
      },
    },
  ),
);
