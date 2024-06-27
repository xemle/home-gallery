import { through } from '@home-gallery/stream';
import { readEntryFilesCached } from '@home-gallery/storage';

export const readStorageData = (storageDir) => {
  const { readEntryFiles, clearCache } = readEntryFilesCached(storageDir);

  const task = (entries, cb) => {
    let i = 0;
    const next = () => {
      if (i === entries.length) {
        return cb();
      }
      const entry = entries[i++];
      readEntryFiles(entry, (err, filesAndMeta) => {
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
    clearCache();
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
