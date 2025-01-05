import * as fs from 'fs'

import Logger from '@home-gallery/logger'

const log = Logger('index.filter.maxFilesize')

import { parseFilesize } from '../utils.js'
import { IIndexEntry, IWalkerFileHandler } from '../types.js'

const isKnown = (filename2Entry, filename, stat) => {
  const entry = filename2Entry[filename]
  return entry && entry.size == stat.size
}

export const createFilesizeFilter = (filename2Entry: Record<string, IIndexEntry>, maxFilesize: string, keepKnownFiles = false): IWalkerFileHandler => {
  const maxSize = parseFilesize(maxFilesize)

  if (maxSize === false) {
    throw new Error(`Invalid max filesize ${maxFilesize}. Valid examples are: 1024, 5m, 0.2GB`)
  }

  log.info(`Limit files up to ${maxFilesize} (${maxSize} bytes)`)

  return (filename: string, stat: fs.Stats) => {
    return (typeof maxSize == 'number' && stat.size <= maxSize) || (keepKnownFiles && isKnown(filename2Entry, filename, stat))
  }
}
