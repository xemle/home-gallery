import fs from 'fs';

export function mkdirp(dir, cb) {
  fs.stat(dir, (err, stat) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.mkdir(dir, { recursive: true }, cb);
      } else {
        cb(err);
      }
      return;
    } else if (!stat.isDirectory()) {
      return cb(new Error(`File ${dir} already exists and it not a directory`));
    }
    cb();
  })
}
