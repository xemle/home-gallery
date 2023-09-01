const { Readable, pipeline } = require('stream')

const log = require('@home-gallery/logger')('export.meta')

const { promisify } = require('@home-gallery/common')
const { readIndexHead } = require('@home-gallery/index')
const { filter, toList } = require('@home-gallery/stream')

const { getMetadataEntries } = require('./entries')
const { createMetadataWriter } = require('./meta')

const readIndexHeadAsync = promisify(readIndexHead)

const getIndexRootMap = async (indices) => {
  log.trace(`Reading file index heads of ${indices.length} indices`)
  const t0 = new Date()
  const indexHeads = await Promise.all(indices.map(index => readIndexHeadAsync(index)))
  log.debug(t0, `Read ${indexHeads.length} file index heads`)
  return Object.fromEntries(indexHeads.map(index => [index.indexName, index.base]))
}

const exportMeta = async (options = {}) => {
  const { indices, database, events, changesAfter, dryRun } = options

  const entries = await getMetadataEntries(database, events, changesAfter)
  if (!entries.length) {
    log.info(`No media entries found for meta data export`)
    return []
  }

  const rootMap = await getIndexRootMap(indices)
  const hasBaseDir = entry => rootMap[entry.files[0]?.index]

  return new Promise((resolve, reject) => {
    pipeline(
      Readable.from(entries),
      filter(hasBaseDir),
      createMetadataWriter(rootMap, dryRun),
      toList().on('data', entries => resolve(entries)),
      err => err && reject(err)
    )
  })
}

module.exports = {
  exportMeta
};