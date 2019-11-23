const Stream = require('stream');
const readIndex = require('./read');

const readStream = (indexFilename, cb) => {
  readIndex(indexFilename, (err, index) => {
    if (err) {
      return cb(err);
    }

    const base = index.base;
    const entries = index.entries.map(e => Object.assign(e, { base: `file://${base}` }))
    const entryStream = new Stream.Readable({objectMode: true});
    entries.forEach(item => entryStream.push(item))
    entryStream.push(null)
    
    cb(null, entryStream);
  })
}

module.exports = readStream;
