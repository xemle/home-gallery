const debug = require('debug')('export:database-cleanup');

const cleanup = (database, cb) => {
  const t0 = Date.now();
  const cleanEntries = database.data.map(entry => {
    delete entry.appliedEventIds;
    delete entry.textCache;
    return entry;
  })
  database.data = cleanEntries;
  debug(`Cleanup ${cleanEntries.length} database entries in ${Date.now() - t0}ms`);
  cb(null, database);
}

module.exports = cleanup;
