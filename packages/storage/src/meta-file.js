const debug = require('debug')('storage:meta-file');

const { readJsonGzip, writeJsonGzip } = require('@home-gallery/common');

function createMeta() {
  return {
    type: 'metastorage',
    version: 1,
    created: new Date().toISOString(),
    entries: {}
  }
}

function readMeta(metaFilename, cb) {
  readJsonGzip(metaFilename, cb);
}

function readOrCreateMeta(metaFilename, cb) {
  readMeta(metaFilename, (err, data) => {
    if (err && err.code === 'ENOENT') {
      return cb(null, createMeta());
    }
    cb(err, data);
  })
}

function writeMeta(metaFilename, data, cb) {
  writeJsonGzip(metaFilename, {...data, ...{created: new Date().toISOString()}}, cb);
}

function updateMeta(metaFilename, entries, cb) {
  if (!entries.length) {
    return cb(null, { entries });
  }

  readOrCreateMeta(metaFilename, (err, data) => {
    if (err) {
      return cb(err);
    }
    
    entries.forEach(entry => {
      const { files, meta } = entry;
      data.entries[entry.sha1sum] = { files, meta };
    });

    writeMeta(metaFilename, data, cb);
  });  
}

module.exports = { createMeta, readMeta, readOrCreateMeta, writeMeta, updateMeta };
