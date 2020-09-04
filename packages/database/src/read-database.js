const { readJsonGzip } = require('@home-gallery/common');

function readDatabase(filename, cb) {
  readJsonGzip(filename, cb);
}

module.exports = readDatabase;