const fs = require('fs');

const { writeJsonGzip } = require('@home-gallery/common');

const { byDirDescFileAsc } = require('./utils');

const writeIndex = (filename, index, cb) => {
  index.created = new Date().toISOString();
  index.data.sort(byDirDescFileAsc);
  const tmp = `${filename}.tmp`;
  writeJsonGzip(tmp, index, err => {
    if (err) {
      cb(err);
    }
    fs.rename(tmp, filename, err => cb(err, err ? null : index));
  });
}

module.exports = writeIndex;
