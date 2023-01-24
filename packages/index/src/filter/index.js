const { fileFilter, promisify } = require('@home-gallery/common')

const { createFilesizeFilter } = require('./filesize-filter')
const { createFilterChain } = require('./filter-chain')
const { createLimitFilter } = require('./limit-filter')

const asyncFileFilter = promisify(fileFilter)

const createFilter = async (entries, options) => {
  const filters = []

  if (options.maxFilesize) {
    filters.push(createFilesizeFilter(entries, options.maxFilesize, options.keepKnownFiles))
  }

  if (options.exclude && options.exclude.length || options.excludeFromFile) {
    const excludeFilter = await asyncFileFilter(options.exclude, options.excludeFromFile)
    filters.push(excludeFilter)
  }

  return createLimitFilter(entries.length, options.addLimits, createFilterChain(filters))
}

module.exports = {
  createFilter
}