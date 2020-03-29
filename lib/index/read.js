const readJsonGzip = require('../utils/read-json-gzip');

const readIndex = (filename, cb) => {
  readJsonGzip(filename, (err, data) => {
    if (err && err.code === 'ENOENT') {
      return cb(null, {entries: []});
    }
    cb(err, data);
  });
}

module.exports = readIndex;
