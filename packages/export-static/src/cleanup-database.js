import Logger from '@home-gallery/logger'

const log = Logger('export.database.cleanup');

export const cleanupDatabase = (database, cb) => {
  const t0 = Date.now();
  const cleanEntries = database.data.map(entry => {
    delete entry.appliedEventIds;
    delete entry.textCache;
    return entry;
  })
  database.data = cleanEntries;
  log.info(t0, `Cleanup ${cleanEntries.length} database entries`);
  cb(null, database);
}
