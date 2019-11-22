const fs = require('fs');
const zlib = require('zlib');
const debug = require('debug')('index:io:read');

const readIndex = (filename, cb) => {
  const t0 = Date.now();
  fs.readFile(filename, (err, buffer) => {
    if (err) {
      if (err.code === 'ENOENT') {
        debug(`File index ${filename} does not exists`)
        return cb(null, { entries: [] });
      }
      debug(`Could not read file index ${filename}: ${err}`)
      return cb(err);
    }
    const t1 = Date.now();
    debug(`Read file to buffer in ${Date.now() - t0}ms`);
    zlib.gunzip(buffer, function (err, data) {
      if (err) {
        debug(`Could not decompress file index ${filename}: ${err}`)
        return cb(err);
      }
  
      const t2 = Date.now();
      debug(`Uncompress file in ${Date.now() - t1}ms`);
      try {
        const index = JSON.parse(data.toString('utf8'));
        debug(`Parse json file in ${Date.now() - t2}ms`);
        debug(`Read file index ${filename} with ${index.entries.length} entries in ${Date.now() - t0}ms`);
        cb(null, index);
      } catch (e) {
        debug(`Could not parse file index ${filename}: ${e}`)
        cb(new Error(e));
      }
    })
  })
}

module.exports = readIndex;
