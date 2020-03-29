const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const debug = require('debug')('utils:io:write');

const writeSafe = require('./write-safe');

function writeJsonGzip(filename, data, cb) {
  let json;
  try {
    json = JSON.stringify(data);
  } catch (e) {
    debug(`Could not stringify data: ${e}`);
    return cb(new Error(`Could not stringify data: ${e}`));
  }
  
  const buffer = Buffer.from(json, 'utf-8');  
  zlib.gzip(buffer, (err, result) => {
    if (err) {
      debug(`Could not compress file ${filename}: ${err}`);
      return cb(err);
    }
    writeSafe(filename, result, (err) => {
      if (err) {
        debug(`Could not write file ${filename}: ${err}`);
        return cb(err);
      }
      cb(null, data);
    });
  });

}

module.exports = writeJsonGzip;
