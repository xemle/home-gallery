import fs from 'fs';

import { writeJsonGzip, writeSafe } from '@home-gallery/common';
import { initDatabase } from './read-database.js'

export const writeDatabase = (filename, entries, cb) => {
  const database = initDatabase(entries);

  const tmp = `${filename}.tmp`;
  writeJsonGzip(tmp, database, err => {
    if (err) {
      return cb(err);
    }
    fs.rename(tmp, filename, err => cb(err, err ? null : database));
  });
}

export const writeDatabasePlain = (filename, entries, cb) => {
  const database = initDatabase(entries);
  const data = JSON.stringify(database);

  const tmp = `${filename}.tmp`;
  writeSafe(tmp, data, err => {
    if (err) {
      return cb(err);
    }
    fs.rename(tmp, filename, err => cb(err, err ? null : database));
  });
}
