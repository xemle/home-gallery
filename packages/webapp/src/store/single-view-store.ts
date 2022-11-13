import create from 'zustand'
import { persist } from 'zustand/middleware'

export interface SingleViewStore {
  lastId: string
  showDetails: boolean
  showNavigation: boolean

  setLastId(lastId: string): void
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
  lastId: '',
  showDetails: false,
  showNavigation: true,

  setLastId: (lastId: string) => set((state) => ({...state, lastId})),
  setShowDetails: (show: boolean) => set((state) => ({...state, showDetails: show})),
  setShowNavigation: (show: boolean) => set((state) => ({...state, showNavigation: show})),
}), { name: 'gallery-single-view' }))
