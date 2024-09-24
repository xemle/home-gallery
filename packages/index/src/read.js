import { readJsonGzip } from '@home-gallery/common';

export const readIndex = (filename, cb) => {
  readJsonGzip(filename, (err, index) => {
    if (err && err.code === 'ENOENT') {
      return cb(null, {data: []});
    }
    if (!index || !index.type || index.type != 'home-gallery/fileindex@1.0') {
      return cb(new Error(`Unknown file index format ${index && index.type || 'unknown'}. Please read CHANGELOG and migrate!`));
    }
    cb(err, index);
  });
}
