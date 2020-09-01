const fs = require('fs');
const { writeJsonGzip } = require('@home-gallery/common');

const rename = (from, to, index, cb) => {
  fs.rename(from, to, (err) => {
    if (err) {
      cb(err);
    } else {
      cb(null, index);
    }
  });
}

const writeIndex = (filename, index, cb) => {
  index.created = new Date().toISOString();
  const tmp = `${filename}.tmp`;
  writeJsonGzip(tmp, index, (err) => {
    if (err) {
      cb(err);
    } else {
      rename(tmp, filename, index, cb);
    }
  });
}

module.exports = writeIndex;
