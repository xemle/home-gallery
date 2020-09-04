const { waterfall } = require('async');
const debug = require('debug')('export:builder');

const readDatabase = require('./read-database');
const applyEvents = require('./apply-events');
const applyQuery = require('./apply-query');
const cleanupDatabase = require('./cleanup-database');
const exportStorage = require('./export-storage');
const writeDatabase = require('./write-database');
const copyWebapp = require('./copy-webapp');
const injectWebappConfig = require('./inject-webapp-config')
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
  const t0 = Date.now();
  waterfall([
    (callback) => buildDatabase(databaseFilename, options.eventsFilename, options.query, callback),
    (database, callback) => exportStorage(database, storageDir, options.outputDirectory, callback),
    (database, outputDirectory, callback) => writeDatabase(database, outputDirectory, callback),
    (outputDirectory, callback) => copyWebapp(outputDirectory, callback),
    (outputDirectory, callback) => injectWebappConfig(outputDirectory, options.webappConfig, callback),
    (outputDirectory, callback) => createArchive(outputDirectory, options.archiveFilename, callback),
    (outputDirectory, archiveFilename, callback) => deleteDirectory(outputDirectory, options.keep, archiveFilename, callback)
  ], (err, outputDirectory, archiveFilename) => {
    cb(err, outputDirectory, archiveFilename);
  })
}







module.exports = { exportBuilder };