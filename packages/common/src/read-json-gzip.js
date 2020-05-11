const fs = require('fs');
const zlib = require('zlib');
const debug = require('debug')('utils:io:read');

const readJsonGzip = (filename, cb) => {
  fs.readFile(filename, (err, buffer) => {
    if (err) {
      return cb(err);
    }
    zlib.gunzip(buffer, (err, data) => {
      if (err) {
        debug(`Could not decompress file ${filename}: ${err}`)
        return cb(err);
      }

      let index;
      try {
        index = JSON.parse(data.toString('utf8'));
      } catch (e) {
        debug(`Could not parse file data ${filename}: ${e}`)
        return cb(new Error(e));
      }
      cb(null, index);
  })
  })
}

module.exports = readJsonGzip;
