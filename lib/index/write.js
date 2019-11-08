const fs = require('fs');
const zlib = require('zlib');
const debug = require('debug')('index:io:write');

const writeIndex = (filename, index, cb) => {
  const t0 = Date.now();
  try {
    index.created = new Date().toISOString();
    const json = JSON.stringify(index);
    const buffer = Buffer.from(json, 'utf-8');
    zlib.gzip(buffer, (err, result) => {
      if (err) {
        debug(`Could not compress index file ${filename}: ${err}`);
        return cb(err);
      }
      fs.writeFile(filename, result, (err) => {
        if (err) {
          debug(`Could not write index file ${filename}: ${err}`);
          return cb(err);
        }
        debug(`Write index file ${filename} with ${index.entries.length} entries in ${Date.now() - t0}ms`);
        cb(null, index);
      });
    });
  } catch (e) {
    debug(`Could not write index file ${filename}: ${e}`);
    cb(new Error(e));
  }
}

module.exports = writeIndex;
