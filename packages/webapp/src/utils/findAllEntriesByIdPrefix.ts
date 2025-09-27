import { type Entry } from "../store/entry";

export const findAllEntriesByIdPrefix = (entries: Entry[], idPrefix: string) => {
  if (!entries?.length) {
    return []
  }

  let low = 0
  let high = entries.length

  while (low < high - 1) {
    const mid = Math.floor((low + high) / 2)
    if (entries[mid].id < idPrefix) {
      low = mid
    } else {
      high = mid
    }
  }

  let pos = entries[low].id.startsWith(idPrefix) ? low : high
  if (!entries[pos].id.startsWith(idPrefix)) {
    return []
  }

  const result = [entries[pos]]
  while (pos + 1 < entries.length && entries[pos + 1].id.startsWith(idPrefix)) {
    pos++
    result.push(entries[pos])
  }
  return result
}