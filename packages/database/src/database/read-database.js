import { readJsonGzip } from '@home-gallery/common';

import { HeaderType, isDatabaseTypeCompatible } from './header.js'
import { migrate } from './migrate.js'

export function readDatabase(filename, cb) {
  readJsonGzip(filename, (err, database) => {
    if (err) {
      return cb(err);
    } else if (!isDatabaseTypeCompatible(database && database.type)) {
      return cb(new Error(`Incompatible database format ${database && database.type || 'unknown'} of file ${filename}. Expect ${HeaderType}`))
    }
    migrate(database, cb)
  });
}

export const initDatabase = (entries) => {
  return {
    type: HeaderType,
    created: new Date().toISOString(),
    data: entries
  }
}

export const readOrCreateDatabase = (filename, cb) => {
  readDatabase(filename, (err, database) => {
    if (err && err.code == 'ENOENT') {
      cb(null, initDatabase([]))
    } else {
      cb(err, database)
    }
  })
}
