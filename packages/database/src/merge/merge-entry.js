import Logger from '@home-gallery/logger'

import { mergeGroups, groupEntriesById } from './entry-group.js'
import { toMultiKeyMap, fileToString, entryToString, uniqBy } from './utils.js'

const log = Logger('database.merge')


const getFileKey = file => `${file.index}:${file.filename}`

const getEntryFileKeys = entry => entry.files.map(getFileKey)

const removeFileFromEntry = (file, entry) => {
  const fileKey = getFileKey(file)
  const fileIndex = entry.files.findIndex(entryFile => fileKey == getFileKey(entryFile))
  if (fileIndex < 0) {
    log.warn(`Expect to find file ${fileKey} in entry ${entryToString(entry)}`)
    return
  }
  log.trace(`Remove file ${fileToString(file)} from entry ${entryToString(entry)}`)
  entry.files.splice(fileIndex, 1)
}

const removeFilesFromEntries = (files, file2Entry) => {
  if (!files.length) {
    return []
  }

  log.debug(`Removing ${files.length} files`)

  const entriesToRemove = []
  files.forEach(file => {
    const fileKey = getFileKey(file)
    const entry = file2Entry[fileKey]
    if (!entry) {
      log.trace(`Database has not entry for file ${fileToString(file)}`)
      return
    } else if (!entry.files.length) {
      log.trace(`Entry has already empty file list ${entryToString(entry)}. Skip it`)
      return
    }

    removeFileFromEntry(file, entry)
    if (!entry.files.length) {
      log.debug(`Entry ${entryToString(entry)} will be removed due last removed file ${fileToString(file)}`)
      entriesToRemove.push(entry)
    }
  })

  if (entriesToRemove.length) {
    log.info(`Removed ${entriesToRemove.length} entries due empty file list`)
  } else {
    log.debug(`No entries found to remove`)
  }
  return entriesToRemove
}

const hasFiles = entry => entry.files && entry.files.length

const removeFiles = entry => entry.files = []

const findEntryByFile = (entry, file2Entry) => {
  for (const file of entry.files) {
    const fileKey = getFileKey(file)
    const entry = file2Entry[fileKey]
    if (entry) {
      return entry
    }
  }
  return
}

const mapEntry2newEntry = (newEntries, file2Entry) => {
  return newEntries.reduce((result, newEntry) => {
    const entry = findEntryByFile(newEntry, file2Entry)
    if (entry) {
      result.push([entry, newEntry])
    }
    return result
  }, [])
}

const toEntry = ([entry]) => entry

const invalidateDatabaseEntries = entry2newEntry => entry2newEntry.map(toEntry).forEach(removeFiles)

const isNewer = (entry, newEntry) => !entry.updated || !newEntry.updated || entry.updated < newEntry.updated

const getValidNewEntries = (newEntries, file2Entry) => {
  return newEntries.filter(newEntry => {
    const entry = findEntryByFile(newEntry, file2Entry)
    return !entry || isNewer(entry, newEntry)
  })
}

const setUpdatedTimestamp = (entries, updated) => {
  const uniqValidEntries = entries
    .filter(uniqBy(entry => getFileKey(entry.files[0])))
    .filter(entry => !entry.update || entry.updated != updated)

  uniqValidEntries.forEach(entry => entry.update = updated)

  return uniqValidEntries
}

const getIndexNames = (entries) => {
  const indices = {}
  entries.forEach(entry => entry.files.forEach(file => indices[file.index] = true))
  return Object.keys(indices)
}

const getFilesByIndexNames = (entries, indexNames) => {
  return entries.reduce((result, entry) => {
    const files = entry.files.filter(file => indexNames.includes(file.index))
    if (files.length) {
      result.push(...files)
    }
    return result
  }, [])
}

const removeMissingNewEntries = (entries, newEntries, file2Entry) => {
  const indexNames = getIndexNames(newEntries)
  log.debug(`Removing non existing entries for indices: ${indexNames.join(', ')}`)

  const newEntryFileKeys = newEntries.reduce((result, entry) => {
    entry.files.forEach(file => result[getFileKey(file)] = true);
    return result
  }, {})
  const entryFiles = getFilesByIndexNames(entries, indexNames)
  const entryOnlyFiles = entryFiles.filter(file => !newEntryFileKeys[getFileKey(file)])
  removeFilesFromEntries(entryOnlyFiles, file2Entry)
}

export const mergeEntries = (entries, newEntries, removedFiles, updated, deleteMissingNewEntries = false) => {
  const file2Entry = toMultiKeyMap(entries, getEntryFileKeys)
  const validNewEntries = getValidNewEntries(newEntries, file2Entry)

  removeFilesFromEntries(removedFiles || [], file2Entry)
  if (deleteMissingNewEntries) {
    removeMissingNewEntries(entries, newEntries, file2Entry)
  }

  const entry2newEntry = mapEntry2newEntry(validNewEntries, file2Entry)
  const changedEntriesByGroup = mergeGroups(entry2newEntry, entries)
  invalidateDatabaseEntries(entry2newEntry)

  const validEntries = entries.filter(hasFiles)
  changedEntriesByGroup.push(...groupEntriesById(validNewEntries, validEntries))

  const changedEntriesByTimestamp = setUpdatedTimestamp(changedEntriesByGroup, updated)

  const mergedEntries = validEntries.concat(validNewEntries)
  mergedEntries.sort((a, b) => a.date > b.date ? -1 : 1)
  return [mergedEntries, validNewEntries, changedEntriesByTimestamp]
}
