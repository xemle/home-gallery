const log = require('@home-gallery/logger')('export.database.cleanup');

const cleanup = (database, cb) => {
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

module.exports = cleanup;
