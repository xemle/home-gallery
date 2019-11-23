const path = require('path');
const Stream = require('stream');
const readIndex = require('./read');

const readStream = (indexFilename, cb) => {
  readIndex(indexFilename, (err, index) => {
    if (err) {
      return cb(err);
    }

    const entries = index.entries.map(e => Object.assign(e, { url: `file://${path.join(index.base, e.filename)}` }))

    const entryStream = new Stream.Readable({objectMode: true});
    entries.forEach(item => entryStream.push(item))
    entryStream.push(null)

    cb(null, entryStream);
  })
}

module.exports = readStream;
