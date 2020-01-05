const path = require('path');
const Stream = require('stream');
const readIndex = require('./read');

const readStream = (indexFilename, cb) => {
  readIndex(indexFilename, (err, index) => {
    if (err) {
      return cb(err);
    }

    const indexName = path.basename(indexFilename).replace(/\.[^.]+$/, '');
    const entries = index.entries.map(e => Object.assign(e, { indexName, url: `file://${path.join(index.base, e.filename)}` }))

    // Sort by dir and name in reverse order
    entries.sort((a, b) => {
      const aDir = path.dirname(a.filename);
      const bDir = path.dirname(b.filename);
      if (aDir < bDir) {
        return 1;
      } else if (aDir > bDir) {
        return -1;
      }
      return path.basename(a.filename) < path.basename(b.filename) ? 1 : -1;
    })

    const entryStream = new Stream.Readable({objectMode: true});
    entries.forEach(item => entryStream.push(item))
    entryStream.push(null)

    cb(null, entryStream);
  })
}

module.exports = readStream;
