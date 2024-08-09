import { pipeline } from 'stream/promises';

import Logger from '@home-gallery/logger'

const log = Logger('database.createEntry');

import { readStreams } from '@home-gallery/index';
import { fileFilter, promisify } from '@home-gallery/common'
import { memoryIndicator, processIndicator, filter, flatten, sort, toList, write } from '@home-gallery/stream';
import { createDatabaseMapperStream } from '@home-gallery/plugin'

import { mapToDatabaseEntry } from './stream/map-database-entry.js';
import { readStorageData } from './stream/read-storage-data.js';
import { groupByDir } from './stream/group-by-dir.js';
import { groupSidecarFiles } from './stream/group-sidecar-files.js';

import { groupMediaByDir } from './stream/group-media-by-dir.js';
import { slimEntries } from './stream/map-slim-entry.js';
import { updateMediaFilesCache } from './stream/update-media-files-cache.js'

const fileFilterAsync = promisify(fileFilter);
const readStreamsAsync = promisify(readStreams);

/**
 * @param {string[]} indexFilenames
 * @param {string} journal
 * @param {import('./storage.js').Storage} storage
 * @param {object} options
 * @returns
 */
export const createEntries = async (indexFilenames, journal, storage, options) => {
  const { supportedTypes, excludes, excludeFromFile } = options.config.database;

  const entryStream = await readStreamsAsync(indexFilenames, journal)
  const fileFilterFn = await fileFilterAsync(excludes, excludeFromFile)

  const mapperStream =  await createDatabaseMapperStream(options.config)

  let result
  await pipeline(
    entryStream,
    filter(entry => entry.fileType === 'f' && entry.sha1sum && entry.size > 0),
    filter(entry => fileFilterFn(entry.filename)),
    mapToDatabaseEntry,

    // Read extrator data per dir
    groupByDir(),
    readStorageData(storage),
    processIndicator({name: 'read directories'}),
    groupSidecarFiles(),
    flatten(),

    // Stream single entry
    filter(entry => supportedTypes.indexOf(entry.type) >= 0),
    mapperStream.stream,
    processIndicator({name: 'map to media'}),
    memoryIndicator({intervalMs: 30 * 1000}),

    // Update media cache
    groupMediaByDir(),
    updateMediaFilesCache(storage),
    flatten(),

    slimEntries(),

    toList(),
    sort(slimEntries => slimEntries.date, true),
    write(slimEntries => result = slimEntries),
  );
  return result;
}

