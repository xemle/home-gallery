import { readJsonGzip, writeJsonGzip } from '@home-gallery/common';

export function createEntryFilesCache() {
  return {
    type: 'entryFilesCache',
    version: 1,
    created: new Date().toISOString(),
    entries: {}
  }
}

export function readEntryFilesCache(cacheFilename, cb) {
  readJsonGzip(cacheFilename, cb);
}

export function readOrCreateEntryFilesCache(cacheFilename, cb) {
  readEntryFilesCache(cacheFilename, (err, data) => {
    if (err && err.code === 'ENOENT') {
      return cb(null, createEntryFilesCache());
    }
    cb(err, data);
  })
}

export function writeEntryFilesCache(cacheFilename, data, cb) {
  writeJsonGzip(cacheFilename, {...data, ...{created: new Date().toISOString()}}, cb);
}

export function updateEntryFilesCache(cacheFilename, entries, cb) {
  if (!entries.length) {
    return cb(null, { entries });
  }

  readOrCreateEntryFilesCache(cacheFilename, (err, data) => {
    if (err) {
      return cb(err);
    }

    entries.forEach(({ sha1sum, files, meta }) => {
      data.entries[sha1sum] = { files, meta };
    });

    writeEntryFilesCache(cacheFilename, data, cb);
  });
}
