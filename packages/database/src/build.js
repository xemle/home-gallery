import Logger from '@home-gallery/logger'

const log = Logger('database.build');

import { mergeFromJournal } from './merge/merge-journalv2.js';
import { writeDatabasev2 } from './database/write-databasev2.js';

import { createStorage } from './storage.js';

import { createEntries } from './create-entries.js'

export async function build(options) {
  const indexFilenames = options.config.fileIndex.files;
  const journal = options.config.fileIndex.journal;

  const storageDir = options.config.storage.dir;
  const storage = createStorage(storageDir)

  const databaseFilename = options.config.database.file;

  const t0 = Date.now()
  const slimEntries = await createEntries(indexFilenames, journal, storage, options)
    .catch(err => {
      log.error(`Could not build database entries: ${err}`);
      throw err
    })
  log.info(t0, `Created ${slimEntries.length} database entries`)

  const t2 = Date.now()
  let count
  if (journal) {
    count = await mergeFromJournal(indexFilenames, journal, databaseFilename, slimEntries, storage)
  } else {
    count = await writeDatabasev2(databaseFilename, slimEntries, storage)
  }
  log.info(t2, `Wrote database with ${count} entries to ${databaseFilename}`)
  return count
}
