import Logger from '@home-gallery/logger'

const log = Logger('export.events');
import { readEvents } from '@home-gallery/events';
import { applyEvents as applyEventsOrig } from '@home-gallery/events';

export const applyEvents = (database, eventsFilename, cb) => {
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
    const changedEntries = applyEventsOrig(database.data, events.data);
    log.info(t1, `Applied ${events.data.length} events to ${changedEntries.length} entries`);

    cb(null, database);
  })
}
