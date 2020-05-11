const { writeJsonGzip } = require('@home-gallery/common');

const writeIndex = (filename, index, cb) => {
  index.created = new Date().toISOString();
  writeJsonGzip(filename, index, cb);
}

module.exports = writeIndex;
