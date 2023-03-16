const fs = require('fs');
const zlib = require('zlib');
const { pipeline, Writable } = require('stream')

const { parseJson } = require('@home-gallery/stream');

const readJsonGzip = (filename, cb) => {
  let data
  pipeline(
    fs.createReadStream(filename),
    zlib.createGunzip(),
    parseJson(),
    new Writable({
      objectMode: true,
      write(chunk, _, done) {
        data = chunk
        done()
      }
    }),
    err => cb(err, data)
  )
}

module.exports = readJsonGzip;
