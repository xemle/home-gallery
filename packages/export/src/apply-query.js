const debug = require('debug')('export:query');

const { filterEntriesByQuery } = require('@home-gallery/query');

const applyQuery = (database, query, cb) => {
  if (!query) {
    return cb(null, database);
  }

  const t0 = Date.now();
  filterEntriesByQuery(database.data, query, (err, entries) => {
    if (err) {
      debug(`Failed to filter entries by query '${query}: ${err}`);
      return cb(err);
    }
    debug(`Found ${entries.length} of ${database.data.length} entries by query '${query}' in ${Date.now() - t0}`);
    database.data = entries;
    cb(null, database);
  })
}

module.exports = applyQuery;
