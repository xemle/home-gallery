const { writeJsonGzip } = require('@home-gallery/common');

function writeDatabase(filename, entries, cb) {
  const database = {
    type: 'home-gallery/database@1.0',
    created: new Date().toISOString(),
    data: entries
  }

  writeJsonGzip(filename, database, cb);
}

module.exports = writeDatabase;