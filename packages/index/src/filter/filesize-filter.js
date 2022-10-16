
const log = require('@home-gallery/logger')('index.filter.maxFilesize')

const { parseFilesize } = require('../utils')

const createFilesizeFilter = (maxFilesize) => {
  const maxSize = parseFilesize(maxFilesize)

  if (maxSize === false) {
    return new Error(`Invalid max filesize ${maxFilesize}. Valid examples are: 1024, 5m, 0.2GB`)
  }

  log.info(`Limit files up to ${maxFilesize} (${maxSize} bytes)`)
  return (_, stat) => {
    const { size } = stat
    return size <= maxSize
  }
}

module.exports = {
  createFilesizeFilter
}