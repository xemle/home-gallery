import path from 'path';
import { pipeline } from 'stream/promises';

import Logger from '@home-gallery/logger'

const log = Logger('extractor');

import { fileFilter, promisify } from '@home-gallery/common';
import { readStreams } from '@home-gallery/index';
import { createExtractorStreams } from '@home-gallery/plugin';

import { concurrent, each, filter, limit, purge, memoryIndicator, processIndicator, skip, flatten } from '@home-gallery/stream';

import { mapToStorageEntry } from './stream/map-storage-entry.js';
import { readAllEntryFiles } from './stream/read-all-entry-files.js';
import { groupByDir } from './stream/group-by-dir.js';
import { groupSidecars, ungroupSidecars } from './stream/group-sidecars.js';
import { groupByEntryFilesCacheKey } from './stream/group-entry-files-cache.js';
import { updateEntryFilesCache } from './stream/update-entry-files-cache.js';

import { createStorage } from './storage.js';

const fileFilterAsync = promisify(fileFilter);
const readStreamsAsync = promisify(readStreams)

export const extract = async (options) => {
  const { config } = options
  const { files, journal, minChecksumDate } = config.fileIndex
  const entryStream = await readStreamsAsync(files, journal)

  const storageDir = path.resolve(config.storage.dir)
  const storage = createStorage(storageDir)
  const fileFilterFn = await fileFilterAsync(config.extractor.excludes, config.extractor.excludeFromFile)

  const [extractorStreams, tearDown] = await createExtractorStreams(options)

  log.info(`Using ${extractorStreams.length} extractor tasks`)
  const metaExtractors = extractorStreams.filter(e => e.extractor.phase == 'meta')
  const rawExtractors = extractorStreams.filter(e => e.extractor.phase == 'raw')
  const fileExtractors = extractorStreams.filter(e => !['meta', 'raw'].includes(e.extractor.phase))
  log.debug(`Using ${metaExtractors.length} extractor tasks for phase meta: ${metaExtractors.map(e => e.extractor.name).join(', ')}`)
  log.debug(`Using ${rawExtractors.length} extractor tasks for phase raw: ${rawExtractors.map(e => e.extractor.name).join(', ')}`)
  log.debug(`Using ${fileExtractors.length} extractor tasks for phase file: ${fileExtractors.map(e => e.extractor.name).join(', ')}`)

  const stream = {
    concurrent: 0,
    skip: 0,
    limit: 0,
    printEntry: false,
    ...config?.extractor?.stream,
    queued: 0,
    processing: 0,
    processed: 0
  }

  const { queueEntry, releaseEntry } = concurrent(stream.concurrent, stream.skip)

  await pipeline(
      entryStream,
      // only files with checksum. Exclude apple files starting with '._'
      filter(entry => entry.fileType === 'f' && entry.sha1sum && entry.size > 0),
      filter(entry => !minChecksumDate || entry.sha1sumDate > minChecksumDate),
      filter(entry => fileFilterFn(entry.filename)),
      skip(stream.skip),
      limit(stream.limit),
      mapToStorageEntry,
      each(() => stream.queued++),
      queueEntry,
      each(() => stream.processing++),
      each(entry => stream.printEntry && log.info(`Processing entry #${stream.skip + stream.processed} ${entry}`)),
      // read existing files and meta data (json files)
      readAllEntryFiles(storage),

      ...metaExtractors.map(e => e.stream), // each single file

      groupByDir(stream.concurrent),
      groupSidecars(),
      flatten(),
      ...rawExtractors.map(e => e.stream), // grouped by sidecars

      ungroupSidecars(),
      ...fileExtractors.map(e => e.stream), // each single file

      each(entry => stream.printEntry && log.debug(`Processed entry #${stream.skip + stream.processed} ${entry}`)),
      releaseEntry,
      each(() => stream.processed++),
      processIndicator({onTick: ({diff, lastTime}) => log.info(lastTime, `Processed ${stream.processed} entries (#${stream.skip + stream.processed}, +${diff}, processing ${stream.processing - stream.processed} and queued ${stream.queued - stream.processing} entries)`)}),

      groupByEntryFilesCacheKey(),
      updateEntryFilesCache(storage),
      processIndicator({name: 'entry dir cache'}),
      memoryIndicator({intervalMs: 30 * 1000}),
      purge(),
    )
    .finally(() => tearDown())

  return stream.processed
}

export { getPluginFiles } from './plugins.js'