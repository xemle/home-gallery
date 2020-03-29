const path = require('path');

const writeSafe = require('../utils/write-safe');
const getMetaKeyName = require('./meta-file-key');

function writeStorageFile(entry, storageDir, filename, data, cb) {
  writeSafe(path.join(storageDir, filename), data, (err) => {
    if (err) {
      return cb(err);
    }
    // Add new file to entry
    entry.files.push(filename);
    // For json files add their content to meta data
    if (filename.match(/\.json$/)) {
      const key = getMetaKeyName(filename);
      entry.meta[key] = JSON.parse(data);
    }
    cb();
  })

}

module.exports = writeStorageFile;
