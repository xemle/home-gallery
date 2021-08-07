const log = require('@home-gallery/logger')('export.events');
const { readEvents } = require('@home-gallery/events/dist/node');
const { applyEvents } = require('@home-gallery/events');

const events = (database, eventsFilename, cb) => {
  if (!eventsFilename) {
    return cb(null, database);
  }
  
  const t0 = Date.now();
  readEvents(eventsFilename, (err, events) => {
    if (err && err.code == 'ENOENT') {
      log.warn(`Events file ${eventsFilename} does not exists. Continue without events`);
      return cb(null, database);
    } else if (err) {
      log.error(err, `Failed to load events from ${eventsFilename}: ${err}`);
      return cb(err);
    }
    log.info(t0, `Read events from ${eventsFilename} with ${events.data.length} events`);

    const t1 = Date.now();
    const entryMap = database.data.reduce((result, entry) => {
      result.set(entry.id, entry);
      return result;
    }, new Map());
    const changedEntries = applyEvents(entryMap, events.data);
    database.data = Array.from(entryMap.values());
    log.info(t1, `Applied ${events.data.length} events to ${changedEntries.length} entries`);

    cb(null, database);
  })
}

module.exports = events;