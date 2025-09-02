import fs from 'fs';

export function readDir(dir, cb) {
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

export function readDirCreate(dir, cb) {
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
