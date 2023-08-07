const { waterfall } = require('async');

const readDatabase = require('./read-database');
const applyEvents = require('./apply-events');
const applyQuery = require('./apply-query');
const cleanupDatabase = require('./cleanup-database');
const exportStorage = require('./export-storage');
const writeDatabase = require('./write-database');
const copyWebapp = require('./copy-webapp');
const injectState = require('./inject-state');
const setBasePath = require('./set-base-path');
const createArchive = require('./create-archive');
const deleteDirectory = require('./delete-directory');
const { wrapCowProxy, unwrapCowProxy } = require('./cow-proxy');

const proxyMutableEntries = (database, cb) => {
  database.data = database.data.map(wrapCowProxy)
  cb(null, database)
}

const buildDatabase = (databaseFilename, eventsFilename, query, cb) => {
  waterfall([
    (callback) => readDatabase(databaseFilename, callback),
    (database, callback) => proxyMutableEntries(database, callback),
    (database, callback) => applyEvents(database, eventsFilename, callback),
    (database, callback) => applyQuery(database, query, callback),
  ], cb);
}

const buildDatabaseImmutableFacade = (databaseFilename, eventsFilename, query, cb) => {
  buildDatabase(databaseFilename, eventsFilename, query, (err, database) => {
    if (err) {
      return cb(err)
    }
    database.data = database.data.map(unwrapCowProxy)
    cb(null, database)
  })
}

const exportBuilder = (databaseFilename, storageDir, options, cb) => {
  waterfall([
    (callback) => buildDatabase(databaseFilename, options.eventsFilename, options.query, callback),
    (database, callback) => cleanupDatabase(database, callback),
    (database, callback) => exportStorage(database, storageDir, options.outputDirectory, options.basePath, callback),
    (database, outputDirectory, basePath, callback) => writeDatabase(database, outputDirectory, basePath, callback),
    (database, outputDirectory, basePath, callback) => copyWebapp(database, outputDirectory, basePath, callback),
    (database, outputDirectory, basePath, callback) => injectState(database, outputDirectory, basePath, options.disabledEdit, callback),
    (outputDirectory, basePath, callback) => setBasePath(outputDirectory, basePath, callback),
    (outputDirectory, callback) => createArchive(outputDirectory, options.archiveFilename, callback),
    (outputDirectory, archiveFilename, callback) => deleteDirectory(outputDirectory, options.keep, archiveFilename, callback)
  ], (err, outputDirectory, archiveFilename) => {
    cb(err, outputDirectory, archiveFilename);
  })
}

module.exports = {
  buildDatabase: buildDatabaseImmutableFacade,
  exportBuilder
};