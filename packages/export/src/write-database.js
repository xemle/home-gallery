const path = require('path')
const debug = require('debug')('export:write-database');

const { writeDatabasePlain } = require('@home-gallery/database');

const write = (database, outputDirectory, basePath, cb) => {
  const t0 = Date.now();
  const filename = path.join(outputDirectory, basePath, 'api', 'database');
  writeDatabasePlain(filename, database.data, (err) => {
    if (err) {
      debug(`Could not write database to ${filename}: ${err}`);
      return cb(err);
    }
    debug(`Wrote database with ${database.data.length} entries to ${filename} in ${Date.now() - t0}ms`)
    cb(null, outputDirectory, basePath);
  })
}

module.exports = write;
