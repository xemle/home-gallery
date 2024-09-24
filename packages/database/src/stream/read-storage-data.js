import { through } from '@home-gallery/stream';

/**
 * @param {import('../storage').Storage} storage
 * @returns {import('stream').Transform}
 */
export const readStorageData = (storage) => {

  const task = (entries, cb) => {
    let i = 0;
    const next = () => {
      if (i === entries.length) {
        return cb();
      }
      const entry = entries[i++];
      storage.readEntryFiles(entry, (err, filesAndMeta) => {
        if (err || !filesAndMeta) {
          filesAndMeta = { files: [], meta: {}};
        }
        entry.files = filesAndMeta.files;
        entry.meta = filesAndMeta.meta;
        if (i % 500 === 0) {
          process.nextTick(next);
        } else {
          next();
        }
      })
    }
    process.nextTick(next);
  };

  const flush = (cb) => {
    storage.clearCache();
    cb();
  }

  return through(function (entry, enc, cb) {
    const that = this;
    const done = () => {
      that.push(entry);
      cb();
    }
    task(entry, done)
  }, flush);
}
