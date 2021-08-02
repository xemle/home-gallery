const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const log = require('@home-gallery/logger')('common.write.jsonGzip');

const writeSafe = require('./write-safe');

function writeJsonGzip(filename, data, cb) {
  let json;
  try {
    json = JSON.stringify(data);
  } catch (e) {
    log.error(`Could not stringify data: ${e}`);
    return cb(new Error(`Could not stringify data: ${e}`));
  }
  
  const buffer = Buffer.from(json, 'utf-8');  
  zlib.gzip(buffer, (err, result) => {
    if (err) {
      log.error(`Could not compress file ${filename}: ${err}`);
      return cb(err);
    }
    writeSafe(filename, result, (err) => {
      if (err) {
        log.error(`Could not write file ${filename}: ${err}`);
        return cb(err);
      }
      cb(null, data);
    });
  });

}

module.exports = writeJsonGzip;
