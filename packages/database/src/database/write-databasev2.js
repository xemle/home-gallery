import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

import { each } from '@home-gallery/stream';

import { createWriteStream } from './write-database-stream.js';
import { fattenEntries } from '../stream/map-slim-entry.js';

export const writeDatabasev2 = async (databaseFilename, slimEntries, storage) => {
  const writeStream = await createWriteStream(databaseFilename)

  let count = 0
  await pipeline(
    Readable.from(slimEntries),
    fattenEntries(storage),
    each(() => count++),
    writeStream,
  )

  return count
}
