import fs from 'fs';
import path from 'path';
import { mkdirp } from './mkdirp.js';

export const writeSafe = (filename, data, cb) => {
  fs.writeFile(filename, data, (err) => {
    if (err && err.code === 'ENOENT') {
      mkdirp(path.dirname(filename), (err) => {
        if (err) {
          return cb(err);
        }
        fs.writeFile(filename, data, cb);
      });
    } else {
      cb(err);
    }
  });
}
