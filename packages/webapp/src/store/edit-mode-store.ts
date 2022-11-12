import create from 'zustand'
import { persist } from 'zustand/middleware'

import { Entry } from './entry'
import { useEntryStore } from './entry-store'

export enum ViewMode {
  VIEW,
  EDIT
}

export interface IdMap {
  [key: string]: boolean
}

export interface EditModeStore {
  viewMode: ViewMode
  selectedIds: IdMap
  lastSelectedId: string
  showSelected: boolean

  setViewMode: (viewMode: ViewMode) => void
  selectAll: () => void
  invert: () => void
  setIds: (ids: string[]) => void
  addIds: (ids: string[]) => void
  toggleId: (id: string) => void
  toggleRange: (id: string) => void
  removeIds: (ids: string[]) => void
  count: () => number
  reset: () => void
  selectedEntries: () => Entry[]
  toggleShowSelected: () => void
}

const getSelectionRange = (entries, firstId, lastId) => {
  let startIndex = -1
  let endIndex = -1

  for (var i = 0; i < entries.length; i++) {
    const entryId = entries[i].id
    if (entryId == firstId && startIndex < 0) {
      startIndex = i
    } else if (entryId === lastId && startIndex < 0) {
      startIndex = i
    } else if (entryId === firstId && startIndex >= 0) {
      endIndex = i + 1
      break
    } else if (entryId === lastId && startIndex >= 0) {
      endIndex = i + 1
      break
    }
  }

  return [startIndex, endIndex]
}

const getSelectionRangeIds = (entries: Entry[], firstId, lastId) => {
  const [start, end] = getSelectionRange(entries, firstId, lastId)
  const ids: string[] = []
  for (var i = start; i < end; i++) {
    ids.push(entries[i].id)
  }
  return ids
}

export const useEditModeStore = create<
  EditModeStore,
  [
    ["zustand/persist", EditModeStore]
  ]
>(
  persist((set, get) => ({
  viewMode: ViewMode.VIEW,
  selectedIds: {},
  lastSelectedId: '',
  showSelected: false,

  setViewMode: (viewMode: ViewMode) => set((state) => ({...state, viewMode})),
  selectAll: () => set((state) => {
    const selectedIds = useEntryStore.getState().entries.reduce((result, entry) => { result[entry.id] = true; return result}, {})
    return {...state, selectedIds}
  }),
  invert: () => set((state) => {
    const entryIds = useEntryStore.getState().entries.map(entry => entry.id)
    const selectedIds = {...state.selectedIds}
    entryIds.forEach(id => selectedIds[id] = !selectedIds[id])
    return {...state, selectedIds}
  }),
  setIds: (ids: string[]) => set((state) => ({...state, selectedIds: ids.reduce((result, id) => { result[id] = true; return result }, {})})),
  addIds: (ids: string[]) => set((state) => {
    const selectedIds = {...state.selectedIds}
    ids.forEach(id => selectedIds[id] = true)
    return {...state, selectedIds }
  }),
  removeIds: (ids: string[]) => set((state) => {
    const selectedIds = {...state.selectedIds}
    ids.filter(id => selectedIds[id]).forEach(id => selectedIds[id] = false)
    return {...state, selectedIds }
  }),
  toggleId: (id: string) => set((state) => {
    const selectedIds = {...state.selectedIds}
    selectedIds[id] = !selectedIds[id]
    return {...state, selectedIds, lastSelectedId: id }
  }),
  toggleRange: (id: string) => set((state) => {
    const lastSelectedId = state.lastSelectedId
    if (!lastSelectedId) {
      const selectedIds = {...state.selectedIds}
      selectedIds[id] = !selectedIds[id]
      return { ...state, selectedIds, lastSelectedId: id }
    }

    const selectedIds = {...state.selectedIds}
    const isLastSelected = selectedIds[lastSelectedId]
    const entries = useEntryStore.getState().entries

    const entryIds = getSelectionRangeIds(entries, lastSelectedId, id)
    state.lastSelectedId = id

    entryIds.forEach(id => selectedIds[id] = isLastSelected)
    return { ...state, selectedIds, lastSelectedId: id }
  }),
  count: () => {
    const { selectedIds } = get()
    const count = Object.values(selectedIds).filter(selected => selected).length
    return count
  },
  selectedEntries: () => {
    const { selectedIds } = get()
    const id2Entries = useEntryStore.getState().id2Entries
    return Object.entries(selectedIds)
      .filter(([id, selected]) => selected && id2Entries[id])
      .map(([id]) => id2Entries[id])
  },
  reset: () => set((state) => ({...state, selectedIds: {}, lastSelectedId: '', inverted: false, showSelected: false})),
  toggleShowSelected: () => set((state) => ({...state, showSelected: !state.showSelected}))
}), { name: 'gallery-edit-mode' }))

export const isSelected = (id: string, state: EditModeStore) => state.selectedIds[id]