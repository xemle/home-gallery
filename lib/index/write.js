const writeJsonGzip = require('../utils/write-json-gzip');

const writeIndex = (filename, index, cb) => {
  index.created = new Date().toISOString();
  writeJsonGzip(filename, index, cb);
}

module.exports = writeIndex;
