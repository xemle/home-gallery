const fs = require('fs');
const zlib = require('zlib');
const { pipeline } = require('stream')

const { parseJson, write } = require('@home-gallery/stream');

const readJsonGzip = (filename, cb) => {
  let result
  pipeline(
    fs.createReadStream(filename),
    zlib.createGunzip(),
    parseJson(),
    write(data => result = data),
    err => cb(err, result)
  )
}

module.exports = readJsonGzip;
