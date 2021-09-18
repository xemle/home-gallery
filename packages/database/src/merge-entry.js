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

const handleRemovedFiles = (dbEntries, id2Entry, removedFiles) => {
  if (!removedFiles.length) {
    return []
  }
  const fileKeyFn = file => `${file.id}:${file.index}:${file.filename}`
  const file2Entry = toMap(dbEntries, e => e.files.map(fileKeyFn))

  const changedEntries = removedFiles.reduce((changedEntries, file) => {
    const key = fileKeyFn(file)
    const entry = file2Entry[key]
    if (!entry) {
      log.trace(`Database has not entry with file key ${key}`)
      return changedEntries
    }

    const index = entry.files.findIndex(entryFile => key == fileKeyFn(entryFile))
    if (index < 0) {
      log.warn(`Expect to find file ${key} in entry ${entryToString(entry)}`)
      return changedEntries
    }
    entry.files.splice(index, 1)
    log.trace(`Remove file ${fileToString(file)} from entry ${entryToString(entry)}`)
    if (!entry.files.length) {
      log.trace(`Remove entry ${entryToString(entry)} due empty file list`)
      delete id2Entry[entry.id]
    } else {
      changedEntries.push(entry)
    }
    return changedEntries
  }, [])

  const validChangedEntries = changedEntries.filter(entry => id2Entry[entry.id])

  return validChangedEntries
}

const isSameFile = (a, b) => a.id == b.id && a.index == b.index && a.filename == b.filename

const entryHasSameFiles = (a, b, aOffset = 0) => {
  if (a.files.length - aOffset != b.files.length) {
    return false
  }
  for (let i = 0; i < b.files.length; i++) {
    if (!isSameFile(a.files[i + aOffset], b.files[i])) {
      return false
    }
  }
  return true
}

const mainFileWasRemoved = (changeEntry, mainFile, id2Entry) => changeEntry.id != mainFile.id && id2Entry[changeEntry.id]

const handleRemovedMainFile = (id2Entry, changedEntries, newEntries) => {
  return changedEntries.reduce((result, changeEntry) => {
    const mainFile = changeEntry.files[0]
    if (!mainFileWasRemoved(changeEntry, mainFile, id2Entry)) {
      result.push(changeEntry)
      return result
    }
    const entry = id2Entry[changeEntry.id]
    const newEntry = newEntries.find(entry => entry.id == mainFile.id)
    if (entryHasSameFiles(entry, newEntry)) {
      log.debug(`Replace entry ${entryToString(entry)} by ${entryToString(newEntry)} due removed main file`)
      delete id2Entry[changeEntry.id]
    }
    return result
  }, [])
}

const hasNewMainFile = (file, fileOffset, id2Entry) => fileOffset != 0 && id2Entry[file.id]

const handleNewMainFile = (id2Entry, newEntries) => {
  newEntries.forEach(newEntry => {
    if (newEntry.files.length == 1) {
      return
    }
    newEntry.files.forEach((file, fileOffset) => {
      if (!hasNewMainFile(file, fileOffset, id2Entry)) {
        return
      }
      const entry = id2Entry[file.id]
      if (entryHasSameFiles(newEntry, entry, fileOffset)) {
        log.debug(`Replace entry ${entryToString(entry)} by ${entryToString(newEntry)} due new main file`)
        delete id2Entry[file.id]
      }
    })
  })
}

const mergeEntries = (dbEntries, newEntries, removedFiles) => {
  const id2Entry = toMap(dbEntries, e => e.id)

  let changedEntries = handleRemovedFiles(dbEntries, id2Entry, removedFiles || [])
  changedEntries = handleRemovedMainFile(id2Entry, changedEntries, newEntries)
  handleNewMainFile(id2Entry, newEntries)

  changedEntries = newEntries.reduce((changedEntries, entry) => {
    if (id2Entry[entry.id]) {
      id2Entry[entry.id] = mergeEntry(entry, id2Entry[entry.id])
      changedEntries.push(id2Entry[entry.id])
    } else {
      id2Entry[entry.id] = entry
    }
    return changedEntries
  }, changedEntries)

  const mergedEntries = Object.values(id2Entry)
  mergedEntries.sort((a, b) => a.date < b.date ? 1 : -1)
  return [mergedEntries, changedEntries]
}

module.exports = {
  mergeEntry,
  matchFile,
  mergeEntries
}