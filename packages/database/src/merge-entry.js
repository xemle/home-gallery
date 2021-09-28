const log = require('@home-gallery/logger')('database.merge')

const hasFirstShorterFilename = (a, b) => a.files[0].filename <= b.files[0].filename

const uniqFilter = valueFn => (v, i, a) => {
  if (i == 0) {
    return true
  }
  const value = valueFn(v)
  const firstEntry = a.find(e => valueFn(e) == value)
  return i === a.indexOf(firstEntry)
}

const getUniqFileSizeSum = a => a.files.filter(uniqFilter(e => e.id)).map(e => e.size).reduce((r, v) => r + v, 0)

const compareUniqFileSizeSum = (a, b) => getUniqFileSizeSum(b) - getUniqFileSizeSum(a)

const isFirstPrimary = (a, b) => {
  if (a.updated && a.updated > b.updated) {
    return true
  }
  const sizeSumCmp = compareUniqFileSizeSum(a, b)
  if (sizeSumCmp == 0) {
    return hasFirstShorterFilename(a, b)
  }
  return sizeSumCmp < 0
}

const matchFile = (a, b) => a.id == b.id && a.index == b.index && a.filename == b.filename

const entryToString = entry => `${entry.id.slice(0, 7)}`

const fileToString = file => `${file.id.slice(0, 7)}:${file.index}:${file.filename}`

const addMissingFilesFrom = (target, other) => {
  other.files.forEach(file => {
    const found = target.files.find(targetFile => matchFile(targetFile, file))
    if (!found) {
      log.trace(`Add ${fileToString(file)} to entry ${fileToString(target)}`)
      target.files.push(file)
    }
  })
  return target
}

const mergeEntry = (a, b) => {
  if (!isFirstPrimary(a, b)) {
    return mergeEntry(b, a)
  }

  return addMissingFilesFrom(a, b)
}

const toMap = (values, keysFn) => values.reduce((result, value) => {
  const keys = keysFn(value)
  if (Array.isArray(keys)) {
    keys.forEach(key => {
      result[key] = value
    })
  } else {
    result[keys] = value
  }
  return result
}, {})

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

  files.forEach(file => {
    const fileKey = getFileKey(file)
    const entry = file2Entry[fileKey]
    if (!entry) {
      log.trace(`Database has not entry for file ${fileToString(file)}`)
      return
    }
    removeFileFromEntry(file, entry)
  })
}

const hasFiles = entry => entry.files && entry.files.length

const removeFiles = entry => entry.files = []

const mapEntry2newEntry = (newEntries, file2Entry) => {
  return newEntries.reduce((result, newEntry) => {
    for (const file of newEntry.files) {
      const fileKey = getFileKey(file)
      const entry = file2Entry[fileKey]
      if (entry) {
        result.push([entry, newEntry])
	      break
      }
    }

    return result
  }, [])
}

const toEntry = ([entry]) => entry

const invalidateDatabaseEntries = entry2newEntry => entry2newEntry.map(toEntry).forEach(removeFiles)

const mergeEntries = (dbEntries, newEntries, removedFiles) => {
  const file2Entry = toMap(dbEntries, getEntryFileKeys)

  removeFilesFromEntries(removedFiles || [], file2Entry)

  const entry2newEntry = mapEntry2newEntry(newEntries, file2Entry)
  invalidateDatabaseEntries(entry2newEntry)

  const validEntries = dbEntries.filter(hasFiles)

  const result = validEntries.concat(newEntries)
  result.sort((a, b) => a.date < b.date ? 1 : -1)
  return result
}

module.exports = {
  mergeEntry,
  mergeEntries
}
