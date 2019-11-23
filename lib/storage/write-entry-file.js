const fs = require('fs');
const path = require('path');

const mkdir = require('../utils/mkdir');
const getMetaKeyName = require('./meta-file-key');

// Create directory of file if it does not exist
function writeFileSafe(filename, data, cb) {
  fs.writeFile(filename, data, (err) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return mkdir(path.dirname(filename), (err) => {
          if (err) {
            return cb(err);
          }
          writeFileSafe(filename, data, cb);
        })
      }
      return cb(err);
    }
    cb(null);
  });
}

function writeStorageFile(entry, storageDir, filename, data, cb) {
  writeFileSafe(path.join(storageDir, filename), data, (err) => {
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
