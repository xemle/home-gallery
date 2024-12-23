import { fileFilter, promisify } from '@home-gallery/common'

import { createFilesizeFilter } from './filesize-filter.js'
import { createFilterChain } from './filter-chain.js'
import { createLimitFilter } from './limit-filter.js'
import { IIndexEntry, IIndexOptions, IWalkerFileHandler } from '../types.js'

const asyncFileFilter = promisify(fileFilter)

const createFilename2Entry = (entries) => {
  return entries
    .reduce((result, entry) => {
      result[entry.filename] = entry
      return result
    }, {})
}

export async function createFilter(entries: IIndexEntry[], options: IIndexOptions): Promise<IWalkerFileHandler> {
  const filters: IWalkerFileHandler[] = []
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
