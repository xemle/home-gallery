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

module.exports = {
  mergeEntry,
  matchFile
}