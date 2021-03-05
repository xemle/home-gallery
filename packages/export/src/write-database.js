const path = require('path')
const debug = require('debug')('export:write-database');

const { writeDatabase, writeDatabasePlain } = require('@home-gallery/database');

const write = (database, outputDirectory, basePath, cb) => {
  const t0 = Date.now();
  const filename = path.join(outputDirectory, basePath, 'api', 'database');
  const gzFilename = `${filename}.gz`;
  writeDatabasePlain(filename, database.data, (err) => {
    if (err) {
      debug(`Could not write database to ${filename}: ${err}`);
      return cb(err);
    }
    writeDatabase(gzFilename, database.data, (err) => {
      if (err) {
        debug(`Could not write compressed database to ${gzFilename}: ${err}`);
        return cb(err);
      }
      debug(`Wrote database with ${database.data.length} entries to ${filename} and ${gzFilename} and in ${Date.now() - t0}ms`)
      cb(null, database, outputDirectory, basePath);
    })
  })
}

module.exports = write;
