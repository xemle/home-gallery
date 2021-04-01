const fs = require('fs');
const path = require('path');
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

const by = keyFn => (a, b) => keyFn(a) < keyFn(b) ? -1 : 1
const byDir = by(e => path.dirname(e.filename))

const writeIndex = (filename, index, cb) => {
  index.created = new Date().toISOString();
  const tmp = `${filename}.tmp`;
  index.data.sort(byDir)
  writeJsonGzip(tmp, index, (err) => {
    if (err) {
      cb(err);
    } else {
      rename(tmp, filename, index, cb);
    }
  });
}

module.exports = writeIndex;
