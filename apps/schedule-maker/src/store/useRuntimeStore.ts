import { create } from "zustand"

type RuntimeState = {
  weekOffset: number
  sidebarOpen: boolean
  imageCache: Record<string, string> // Map of image keys to base64 data

  // Actions
  toggleSidebar: () => void
  nextWeek: () => void
  prevWeek: () => void
  cacheImage: (key: string, dataUrl: string) => void
  clearImageCache: () => void
}

export const useRuntimeStore = create<RuntimeState>((set) => ({
  weekOffset: 0,
  sidebarOpen: true,
  imageCache: {},

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  nextWeek: () => set((s) => ({ weekOffset: s.weekOffset + 1 })),
  prevWeek: () => set((s) => ({ weekOffset: s.weekOffset - 1 })),

  cacheImage: (key, dataUrl) =>
    set((s) => ({
      imageCache: { ...s.imageCache, [key]: dataUrl },
    })),
  clearImageCache: () => set({ imageCache: {} }),
}))
