import create from 'zustand'
import { persist } from 'zustand/middleware'

export interface SingleViewStore {
  lastId: string
  lastIndex: number
  showDetails: boolean
  showNavigation: boolean

  setLastId(lastId: string): void
  setLastIndex(lastIndex: number): void
  setShowDetails(show: boolean): void
  setShowNavigation(show: boolean): void
}

const excludeStateProps = (excludeProps: string[] = []) => (state: any): any => Object.fromEntries(
  Object.entries(state).filter(([key]) => !excludeProps.includes(key)))

export const useSingleViewStore = create<
  SingleViewStore,
  [
    ["zustand/persist", SingleViewStore]
  ]
>(
  persist((set) => ({
  lastId: '',
  lastIndex: -1,
  showDetails: false,
  showNavigation: true,

  setLastId: (lastId: string) => set((state: SingleViewStore) => ({...state, lastId})),
  setLastIndex: (lastIndex: number) => set((state: SingleViewStore) => ({...state, lastIndex})),
  setShowDetails: (show: boolean) => set((state: SingleViewStore) => ({...state, showDetails: show})),
  setShowNavigation: (show: boolean) => set((state: SingleViewStore) => ({...state, showNavigation: show})),
}), {
  name: 'gallery-single-view',
  partialize: excludeStateProps(['lastId', 'lastIndex']),
}))
