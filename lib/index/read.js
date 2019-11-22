const readJsonGzip = require('../utils/read-json-gzip');

const readIndex = (filename, cb) => {
  readJsonGzip(filename, cb)
}

module.exports = readIndex;
