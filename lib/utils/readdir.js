const fs = require('fs');

function readDir(dir, cb) {
  fs.readdir(dir, (err, files) => {
    if (err) {
      return cb(err);
    }
    cb(err, files);
  });
}

function createDir(dir, cb) {
  mkdir(dir, (err) => {
    if (err) {
      cb(err);
    } else {
      cb(null, []);
    }
  });
}

function readDirCreate(dir, cb) {
  readdir(dir, (err, files) => {
    if (err && err.code === 'ENOENT') {
      return createDir(dir, cb);
    } else if (err) {
      cb(err);
    } else {
      cb(err, files);
    }
  });
}

module.exports = { readDir, readDirCreate };