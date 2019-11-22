const fs = require('fs');
const zlib = require('zlib');
const debug = require('debug')('utils:io:write');

function writeJsonGzip(filename, data, cb) {
  const t0 = Date.now();
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
    fs.writeFile(filename, result, (err) => {
      if (err) {
        debug(`Could not write file ${filename}: ${err}`);
        return cb(err);
      }
      debug(`Wrote data to compressed file ${filename} in ${Date.now() - t0}ms`);
      cb(null, data);
    });
  });

}

module.exports = writeJsonGzip;
