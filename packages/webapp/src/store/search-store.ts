import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Search {
  type: 'none' | 'year' | 'query' | 'similar' | 'faces'
  value?: any
  query?: string
}

export interface SearchStore {
  query: Search
  search: (query: Search) => void
}

export const useSearchStore = create<
  SearchStore,
  [
    ["zustand/persist", SearchStore]
  ]
  >(
  persist((set, get) => ({
    query: { type: 'none' },

    search: (query: Search) => {
      set((state) => ({...state, query}))
    },
  }), { name: 'gallery-search' })
)

