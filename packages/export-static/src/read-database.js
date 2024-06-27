import Logger from '@home-gallery/logger'

const log = Logger('export.database.read');
import { readDatabase as requireDatabaseOrig } from '@home-gallery/database';

export const readDatabase = (databaseFilename, cb) => {
  const t0 = Date.now();
  requireDatabaseOrig(databaseFilename, (err, database) => {
    if (err) {
      log.info(`Loading database ${databaseFilename} failed: ${err}`);
      return cb(err);
    }
    log.info(t0, `Read database file ${databaseFilename} with ${database.data.length} entries`);
    cb(null, database);
  })
}
