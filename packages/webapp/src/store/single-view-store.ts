import create from 'zustand'
import { persist } from 'zustand/middleware'

export interface SingleViewStore {
  showDetails: boolean
  showNavigation: boolean

  setShowDetails(show: boolean): void
  setShowNavigation(show: boolean): void
}

export const useSingleViewStore = create<
  SingleViewStore,
  [
    ["zustand/persist", SingleViewStore]
  ]
>(
  persist((set) => ({
  showDetails: false,
  showNavigation: true,

  setShowDetails: (show: boolean) => set((state) => ({...state, showDetails: show})),
  setShowNavigation: (show: boolean) => set((state) => ({...state, showNavigation: show})),
}), { name: 'gallery-single-view' }))
