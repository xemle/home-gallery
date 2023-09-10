const { fileFilter, promisify } = require('@home-gallery/common')

const { createFilesizeFilter } = require('./filesize-filter')
const { createFilterChain } = require('./filter-chain')
const { createLimitFilter } = require('./limit-filter')

const asyncFileFilter = promisify(fileFilter)

const createFilename2Entry = (entries) => {
  return entries
    .reduce((result, entry) => {
      result[entry.filename] = entry
      return result
    }, {})
}

const createFilter = async (entries, options) => {
  const filters = []
  const filename2Entry = createFilename2Entry(entries)

  if (options.maxFilesize) {
    filters.push(createFilesizeFilter(filename2Entry, options.maxFilesize, options.keepKnownFiles))
  }

  if (options.exclude && options.exclude.length || options.excludeFromFile) {
    const excludeFilter = await asyncFileFilter(options.exclude, options.excludeFromFile)
    filters.push(excludeFilter)
  }

  return createLimitFilter(entries.length, filename2Entry, options.addLimits, createFilterChain(filters))
}

module.exports = {
  createFilter
}