import { stringifyEntry } from './stringify-entry.js'

export const createStringifyEntryCache = () => {
  let cache = new WeakMap()

  return {
    stringifyEntry: entry => {
      if (!cache.has(entry)) {
        cache.set(entry, stringifyEntry(entry))
      }
      return cache.get(entry)
    },
    evictEntries: entries => {
      entries.forEach(entry => cache[entry.id] = false)
    },
    evictAll: () => {
      cache = new WeakMap()
    }
  }
}
