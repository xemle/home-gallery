const log = require('@home-gallery/logger')('index.filter.maxFilesize')

const { parseFilesize } = require('../utils')

const isKnown = (filename2Entry, filename, stat) => {
  const entry = filename2Entry[filename]
  return entry && entry.size == stat.size
}

const createFilesizeFilter = (filename2Entry, maxFilesize, keepKnownFiles = false) => {
  const maxSize = parseFilesize(maxFilesize)

  if (maxSize === false) {
    return new Error(`Invalid max filesize ${maxFilesize}. Valid examples are: 1024, 5m, 0.2GB`)
  }

  log.info(`Limit files up to ${maxFilesize} (${maxSize} bytes)`)

  return (filename, stat) => {
    return stat.size <= maxSize || (keepKnownFiles && isKnown(filename2Entry, filename, stat))
  }
}

module.exports = {
  createFilesizeFilter
}