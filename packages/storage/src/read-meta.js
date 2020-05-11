const through2 = require('through2');

const readStorageFiles = require('./read-storage-files');

function readMeta(storageDir) {
  return through2.obj(function (entry, enc, cb) {
    const that = this;
    readStorageFiles(entry, storageDir, (err, filesAndMeta) => {
      if (err) {
        return cb(err);
      }
      that.push({...entry, ...filesAndMeta});
      cb();
    })
  });
}

module.exports = readMeta;
