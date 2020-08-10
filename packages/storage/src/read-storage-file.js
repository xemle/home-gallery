const fs = require('fs');
const path = require('path');

function readStorageFile(storageDir, entryFile, cb) {
  fs.readFile(path.join(storageDir, entryFile), cb);
}

module.exports = readStorageFile;
