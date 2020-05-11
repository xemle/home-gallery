const path = require('path');
const through2 = require('through2');
const debug = require('debug')('extract:writeMetaCache');

const { updateMeta, getMetaCacheFilename } = require('@home-gallery/storage');

const writeMetaCache = (storageDir) => {
  return through2.obj(function (entries, enc, cb) {
    if (!entries.length) {
      return cb();
    }

    const filename = getMetaCacheFilename(entries[0]);
    const metaFilename = path.join(storageDir, filename);

    updateMeta(metaFilename, entries, (err) => {
      if (err) {
        debug(`Could not write meta data cache file ${filename} for ${entries.length} entries: ${err}`);
      }
      cb();
    });

  });

}

module.exports = { writeMetaCache }
