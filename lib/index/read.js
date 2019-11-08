const fs = require('fs');
const zlib = require('zlib');
const debug = require('debug')('index:io:read');

const readIndex = (filename, cb) => {
  const t0 = Date.now();
  fs.readFile(filename, (err, buffer) => {
    if (err) {
      if (err.code === 'ENOENT') {
        debug(`Index file ${filename} does not exists`)
        return cb(null, { entries: [] });
      }
      debug(`Could not read index file ${filename}: ${err}`)
      return cb(err);
    }
    zlib.gunzip(buffer, function (err, data) {
      if (err) {
        debug(`Could not decompress index file ${filename}: ${err}`)
        return cb(err);
      }
  
      try {
        const index = JSON.parse(data.toString('utf8'));
        debug(`Read index file ${filename} with ${index.entries.length} entries in ${Date.now() - t0}ms`);
        cb(null, index);
      } catch (e) {
        debug(`Could not parse index file ${filename}: ${e}`)
        cb(new Error(e));
      }
    })
  })
}

module.exports = readIndex;
