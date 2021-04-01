const fs = require('fs');
const zlib = require('zlib');
const { pipeline } = require('stream')

const { parseJson } = require('@home-gallery/stream');

const readJsonGzip = (filename, cb) => {
  pipeline(
    fs.createReadStream(filename),
    zlib.createGunzip(),
    parseJson().on('data', data => cb(null, data)),
    err => err && cb(err)
  )
}

module.exports = readJsonGzip;
