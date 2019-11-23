const fs = require('fs');
const path = require('path');

function mkdir(dir, cb) {
  fs.stat(dir, (err, stat) => {
    if (err) {
      if (err.code === 'ENOENT') {
        const dirname = path.dirname(dir);
        mkdir(dirname, (err) => {
          if (err) {
            return cb(err);
          }
          fs.mkdir(dir, cb);
        });
      } else {
        cb(err);
      }
      return;
    }
    if (!stat.isDirectory()) {
      return cb(new Error(`File ${dir} already exists and it not a directory`));
    }
    cb();
  })
}

module.exports = mkdir;