const fs = require('fs');

function readDir(dir, cb) {
  fs.readdir(dir, (err, files) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return cb(null, []);
      } else {
        cb(err);
      }
    } else {
      cb(err, files);
    }
  });
}

function readDirCreate(dir, cb) {
  fs.readdir(dir, (err, files) => {
    if (err && err.code === 'ENOENT') {
      return mkdir(dir, (err) => {
        if (err) {
          cb(err);
        } else {
          cb(null, []);
        }
      })
    } else if (err) {
      cb(err);
    } else {
      cb(err, files);
    }
  });
}

module.exports = { readDir, readDirCreate };