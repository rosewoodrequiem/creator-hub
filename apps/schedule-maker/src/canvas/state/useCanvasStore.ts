import { create } from 'zustand'

type CanvasState = {
  selectedComponentId: number | null
  selectComponent: (id: number) => void
  deselect: () => void
}

export const useCanvasStore = create<CanvasState>((set) => ({
  selectedComponentId: null,
  selectComponent: (id) => set({ selectedComponentId: id }),
  deselect: () => set({ selectedComponentId: null }),
}))
