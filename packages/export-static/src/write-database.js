import path from 'path'

import Logger from '@home-gallery/logger'

const log = Logger('export.database.write');
import { writeDatabasePlain } from '@home-gallery/database';

export const writeDatabase = (database, dir, basePath, cb) => {
  const t0 = Date.now();
  const filename = path.join(dir, basePath, 'api', 'database.json');
  writeDatabasePlain(filename, database.data, (err) => {
    if (err) {
      log.error(`Could not write database to ${filename}: ${err}`);
      return cb(err);
    }
    log.info(t0, `Wrote database with ${database.data.length} entries to ${filename}`)
    cb(null, database, dir, basePath);
  })
}
