const { stringifyEntry } = require('./stringify-entry')

const createStringifyEntryCache = () => {
  let cache = {}

  return {
    stringifyEntry: entry => {
      if (!cache[entry.id]) {
        cache[entry.id] = stringifyEntry(entry)
      }
      return cache[entry.id]
    },
    evictEntries: entries => {
      entries.forEach(entry => cache[entry.id] = false)
    },
    evictAll: () => {
      cache = {}
    }
  }
}

module.exports = {
  createStringifyEntryCache,
}