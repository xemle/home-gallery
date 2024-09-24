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
      entries
        .filter(entry => cache.has(entry))
        .forEach(entry => cache.delete(entry))
    },
    evictAll: () => {
      cache = new WeakMap()
    }
  }
}
