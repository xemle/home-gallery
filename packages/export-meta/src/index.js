import { Readable } from 'stream'
import { pipeline } from 'stream/promises'

import Logger from '@home-gallery/logger'

const log = Logger('export.meta')

import { promisify } from '@home-gallery/common'
import { readIndexHead } from '@home-gallery/index'
import { filter, toList, write } from '@home-gallery/stream'

import { getMetadataEntries } from './entries.js'
import { createMetadataWriter } from './meta.js'

const readIndexHeadAsync = promisify(readIndexHead)

const getIndexRootMap = async (indices) => {
  log.trace(`Reading file index heads of ${indices.length} indices`)
  const t0 = new Date()
  const indexHeads = await Promise.all(indices.map(index => readIndexHeadAsync(index)))
  log.debug(t0, `Read ${indexHeads.length} file index heads`)
  return Object.fromEntries(indexHeads.map(index => [index.indexName, index.base]))
}

export const exportMeta = async (options = {}) => {
  const indices = options.config.fileIndex.files
  const database = options.config.database.file
  const events = options.config.events.file

  const { changesAfter, dryRun } = options.config.exportMeta

  const entries = await getMetadataEntries(database, events, changesAfter)
  if (!entries.length) {
    log.info(`No media entries found for meta data export`)
    return []
  }

  const rootMap = await getIndexRootMap(indices)
  const hasBaseDir = entry => rootMap[entry.files[0]?.index]

  let result
  await pipeline(
    Readable.from(entries),
    filter(hasBaseDir),
    createMetadataWriter(rootMap, dryRun),
    toList(),
    write(data => result = data)
  )
  return result
}
