import { waterfall } from 'async';

import { readDatabase } from './read-database.js';
import { applyEvents } from './apply-events.js';
import { applyQuery } from './apply-query.js';
import { cleanupDatabase } from './cleanup-database.js';
import { exportStorage } from './export-storage.js';
import { writeDatabase } from './write-database.js';
import { copyWebapp } from './copy-webapp.js';
import { injectState } from './inject-state.js';
import { setBasePath } from './set-base-path.js';
import { createArchive } from './create-archive.js';
import { deleteDirectory } from './delete-directory.js';
import { wrapCowProxy, unwrapCowProxy } from './cow-proxy.js';

const proxyMutableEntries = (database, cb) => {
  database.data = database.data.map(wrapCowProxy)
  cb(null, database)
}

const buildDatabaseWithProxy = (databaseFilename, eventsFilename, query, cb) => {
  waterfall([
    (callback) => readDatabase(databaseFilename, callback),
    (database, callback) => proxyMutableEntries(database, callback),
    (database, callback) => applyEvents(database, eventsFilename, callback),
    (database, callback) => applyQuery(database, query, callback),
  ], cb);
}

export const buildDatabase = (databaseFilename, eventsFilename, query, cb) => {
  buildDatabaseWithProxy(databaseFilename, eventsFilename, query, (err, database) => {
    if (err) {
      return cb(err)
    }
    database.data = database.data.map(unwrapCowProxy)
    cb(null, database)
  })
}

export const exportBuilder = (options, cb) => {
  const databaseFile = options.config.database.file
  const eventFile = options.config.events.file
  const storageDir = options.config.storage.dir

  const exportOptions = options.config.export

  waterfall([
    (callback) => buildDatabaseWithProxy(databaseFile, eventFile, exportOptions.query, callback),
    (database, callback) => cleanupDatabase(database, callback),
    (database, callback) => exportStorage(database, storageDir, exportOptions.dir, exportOptions.basePath, callback),
    (database, dir, basePath, callback) => writeDatabase(database, dir, basePath, callback),
    (database, dir, basePath, callback) => copyWebapp(database, dir, basePath, callback),
    (database, dir, basePath, callback) => injectState(database, dir, basePath, exportOptions.disabledEdit, callback),
    (dir, basePath, callback) => setBasePath(dir, basePath, callback),
    (dir, callback) => createArchive(dir, exportOptions.archiveFile, callback),
    (dir, archiveFile, callback) => deleteDirectory(dir, exportOptions.keepDir, archiveFile, callback)
  ], (err, dir, archiveFile) => {
    cb(err, dir, archiveFile);
  })
}
