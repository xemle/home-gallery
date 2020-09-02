const { readJsonGzip, writeJsonGzip } = require('@home-gallery/common');

function create() {
  return {
    type: 'entryFilesCache',
    version: 1,
    created: new Date().toISOString(),
    entries: {}
  }
}

function read(cacheFilename, cb) {
  readJsonGzip(cacheFilename, cb);
}

function readOrCreate(cacheFilename, cb) {
  read(cacheFilename, (err, data) => {
    if (err && err.code === 'ENOENT') {
      return cb(null, create());
    }
    cb(err, data);
  })
}

function write(cacheFilename, data, cb) {
  writeJsonGzip(cacheFilename, {...data, ...{created: new Date().toISOString()}}, cb);
}

function update(cacheFilename, entries, cb) {
  if (!entries.length) {
    return cb(null, { entries });
  }

  readOrCreate(cacheFilename, (err, data) => {
    if (err) {
      return cb(err);
    }

    entries.forEach(({ sha1sum, files, meta }) => {
      data.entries[sha1sum] = { files, meta };
    });

    write(cacheFilename, data, cb);
  });
}

module.exports = {
  createEntryFilesCache: create,
  readEntryFilesCache: read,
  readOrCreateEntryFilesCache: readOrCreate,
  writeEntryFilesCache: write,
  updateEntryFilesCache: update
};
