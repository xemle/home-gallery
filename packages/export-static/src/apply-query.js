const log = require('@home-gallery/logger')('export.query');
const { filterEntriesByQuery, createStringifyEntryCache } = require('@home-gallery/query');

const applyQuery = (database, query, cb) => {
  if (!query) {
    return cb(null, database);
  }

  const t0 = Date.now();
  const stringifyEntryCache = createStringifyEntryCache();
  filterEntriesByQuery(database.data, query, {textFn: stringifyEntryCache.stringifyEntry})
    .then(({entries}) => {
      log.info(t0, `Found ${entries.length} of ${database.data.length} entries by query '${query}'`);
      database.data = entries;
      cb(null, database);
    })
    .catch(err => {
      log.error(err, `Failed to filter entries by query '${query}: ${err}`);
      return cb(err);
    })
}

module.exports = applyQuery;
