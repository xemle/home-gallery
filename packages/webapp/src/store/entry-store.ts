import create from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

import { Entry } from './entry'

export type Id2EntryMap = {[key: string]: Entry}

export interface EntryStore {
  id2Entries: Id2EntryMap
  allEntries: Entry[]
  entries: Entry[]

  addEntries: (entries: Entry[]) => void
  setEntries: (entries: Entry[]) => void
}

const slice = (set) => ({
  id2Entries: {},
  allEntries: [],
  entries: [],

  addEntries: (entries: Entry[]) => set((state) => {
    if (!entries.length) {
      return state
    }
    console.log(`Add ${entries.length} entries to the store`)
    const id2Entries: Id2EntryMap = entries.reduce((result, entry) => {
      result[entry.id] = entry
      return result
    }, {})
    const mergedId2Entries = {...state.id2Entries, ...id2Entries}
    const allEntries = Object.values(mergedId2Entries)
    
    // SearchStore will listen to allEntries changes and updates entries
    return {
      ...state,
      id2Entries: mergedId2Entries,
      allEntries
    }
  }),

  setEntries: (entries: Entry[]) => set((state) => ({...state, entries}))
})

export const useEntryStore = create<
  EntryStore,
  [
    ["zustand/subscribeWithSelector", never]
  ]
>(subscribeWithSelector<EntryStore>(slice))
