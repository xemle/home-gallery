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

const buildDatabase = (databaseFilename, eventsFilename, query, cb) => {
  waterfall([
    (callback) => readDatabase(databaseFilename, callback),
    (database, callback) => applyEvents(database, eventsFilename, callback),
    (database, callback) => applyQuery(database, query, callback),
    (database, callback) => cleanupDatabase(database,callback),
  ], cb);
}

const exportBuilder = (databaseFilename, storageDir, options, cb) => {
  waterfall([
    (callback) => buildDatabase(databaseFilename, options.eventsFilename, options.query, callback),
    (database, callback) => exportStorage(database, storageDir, options.outputDirectory, options.basePath, callback),
    (database, outputDirectory, basePath, callback) => writeDatabase(database, outputDirectory, basePath, callback),
    (database, outputDirectory, basePath, callback) => copyWebapp(database, outputDirectory, basePath, callback),
    (database, outputDirectory, basePath, callback) => injectState(database, outputDirectory, basePath, callback),
    (outputDirectory, basePath, callback) => setBasePath(outputDirectory, basePath, callback),
    (outputDirectory, callback) => createArchive(outputDirectory, options.archiveFilename, callback),
    (outputDirectory, archiveFilename, callback) => deleteDirectory(outputDirectory, options.keep, archiveFilename, callback)
  ], (err, outputDirectory, archiveFilename) => {
    cb(err, outputDirectory, archiveFilename);
  })
}







module.exports = { exportBuilder };