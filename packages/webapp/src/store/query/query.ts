import { Entry } from '../entry'

import { filterEntriesByQuery, stringifyAst, stringifyEntry } from '@home-gallery/query'

const stringifyEntryTextCache = entry => {
  if (!entry.textCache) {
    entry.textCache = stringifyEntry(entry)
  }
  return entry.textCache
}

export const execQuery = async (entries: Entry[], query: String) => {
  if (!entries.length) {
    return entries;
  }

  const t0 = Date.now()
  return filterEntriesByQuery(entries, query, {textFn: stringifyEntryTextCache})
    .then(({entries: filtered, ast}) => {
      console.log(`Found ${filtered.length} of ${entries.length} entries by query '${query}' (resolved to '${stringifyAst(ast)}') in ${Date.now() - t0}ms`)
      return filtered
    })
    .catch(err => {
      console.log(`Could not build query of ${query}: ${err}`, err)
      return entries
    })
}