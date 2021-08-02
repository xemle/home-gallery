const log = require('@home-gallery/logger')('export.query');
const { filterEntriesByQuery } = require('@home-gallery/query');

const applyQuery = (database, query, cb) => {
  if (!query) {
    return cb(null, database);
  }

  const t0 = Date.now();
  filterEntriesByQuery(database.data, query, (err, entries) => {
    if (err) {
      log.error(`Failed to filter entries by query '${query}: ${err}`);
      return cb(err);
    }
    log.info(t0, `Found ${entries.length} of ${database.data.length} entries by query '${query}'`);
    database.data = entries;
    cb(null, database);
  })
}

module.exports = applyQuery;
