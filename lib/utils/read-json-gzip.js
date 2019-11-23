const fs = require('fs');
const zlib = require('zlib');
const debug = require('debug')('utils:io:read');

const readJsonGzip = (filename, cb) => {
  const t0 = Date.now();
  fs.readFile(filename, (err, buffer) => {
    if (err) {
      if (err.code === 'ENOENT') {
        debug(`File ${filename} does not exists`)
        return cb(null, { entries: [] });
      }
      debug(`Could not read file ${filename}: ${err}`)
      return cb(err);
    }
    const t1 = Date.now();
    debug(`Read file to buffer in ${Date.now() - t0}ms`);
    zlib.gunzip(buffer, function (err, data) {
      if (err) {
        debug(`Could not decompress file ${filename}: ${err}`)
        return cb(err);
      }

      const t2 = Date.now();
      debug(`Uncompress file in ${Date.now() - t1}ms`);
      let index;
      try {
        index = JSON.parse(data.toString('utf8'));
        debug(`Parse json file in ${Date.now() - t2}ms`);
      } catch (e) {
        debug(`Could not parse file data ${filename}: ${e}`)
        return cb(new Error(e));
      }
      debug(`Read file ${filename} in ${Date.now() - t0}ms`);
      cb(null, index);
  })
  })
}

module.exports = readJsonGzip;
