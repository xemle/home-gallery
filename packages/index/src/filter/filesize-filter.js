const log = require('@home-gallery/logger')('index.filter.maxFilesize')

const { parseFilesize } = require('../utils')

const createName2Entry = (entries, maxSize) => {
  return entries
    .filter(entry => entry.size > maxSize)
    .reduce((result, entry) => {
      result[entry.filename] = entry
      return result
    }, {})
}

const isKnown = (name2entry, filename, stat) => {
  const entry = name2entry[filename]
  return entry && entry.size == stat.size
}

const createFilesizeFilter = (entries, maxFilesize, keepKnownFiles = false) => {
  const maxSize = parseFilesize(maxFilesize)

  if (maxSize === false) {
    return new Error(`Invalid max filesize ${maxFilesize}. Valid examples are: 1024, 5m, 0.2GB`)
  }

  log.info(`Limit files up to ${maxFilesize} (${maxSize} bytes)`)

  if (keepKnownFiles) {
    const name2entry = createName2Entry(entries, maxSize)
    return (filename, stat) => {
      return stat.size <= maxSize || isKnown(name2entry, filename, stat)
    }
  } else {
    return (_, stat) => {
      return stat.size <= maxSize
    }
  }
}

module.exports = {
  createFilesizeFilter
}