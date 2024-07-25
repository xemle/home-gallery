import { readJsonGzip } from '@home-gallery/common';

import { migrate, getDatabaseFileType } from './migrate.js'

export function readDatabase(filename, cb) {
  readJsonGzip(filename, (err, database) => {
    if (err) {
      return cb(err);
    }
    migrate(database).then(database => cb(null, database), cb)
  });
}

export const initDatabase = (entries) => {
  const databaseFileType = getDatabaseFileType()
  return {
    type: databaseFileType.toString(),
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
