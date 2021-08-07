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
  const sizeSumCmp = compareUniqFileSizeSum(a, b)
  if (sizeSumCmp == 0) {
    return hasFirstShorterFilename(a, b)
  }
  return sizeSumCmp < 0
}

const matchFile = (a, b) => a.id == b.id && a.index == b.index && a.filename == b.filename

const addMissingFilesFrom = (target, other) => {
  other.files.forEach(file => {
    const found = target.files.find(targetFile => matchFile(targetFile, file))
    if (!found) {
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

const toMap = (values, keyFn) => values.reduce((result, value) => {
  const key = keyFn(value)
  result[key] = value
  return result
}, {})

const removeFile = (dbEntry, removedFile) => {
  dbEntry.files = dbEntry.files.filter(file => !matchFile(file, removedFile))
  return !dbEntry.files.length
}

const mergeEntries = (dbEntries, newEntries, removedFiles) => {
  removedFiles = removedFiles || []
  const dbById = toMap(dbEntries, e => e.id)

  removedFiles.forEach(file => {
    if (!dbById[file.id]) {
      return
    }
    if (removeFile(dbById[file.id], file)) {
      delete dbById[file.id]
    }
  })

  newEntries.forEach(entry => {
    dbById[entry.id] = dbById[entry.id] ? mergeEntry(dbById[entry.id], entry) : entry
  })

  const updatedEntries = Object.values(dbById)
  updatedEntries.sort((a, b) => a.date < b.date ? 1 : -1)
  return updatedEntries
}

module.exports = {
  mergeEntry,
  matchFile,
  mergeEntries
}