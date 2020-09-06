const path = require('path');
const Stream = require('stream');
const mergeStream = require('merge-stream');
const debug = require('debug')('index:readStream');

const readIndex = require('./read');

const readStream = (indexFilename, cb) => {
  const t0 = Date.now();
  readIndex(indexFilename, (err, index) => {
    if (err) {
      return cb(err);
    }

    const indexName = path.basename(indexFilename).replace(/\.[^.]+$/, '');
    const entries = index.data.map(e => Object.assign(e, { indexName, url: `file://${path.join(index.base, e.filename)}` }))

    const entryStream = new Stream.Readable({objectMode: true});
    entries.forEach(item => entryStream.push(item))
    entryStream.push(null);
    debug(`Read file index from ${indexFilename} with ${entries.length} entries in ${Date.now() - t0}ms`);

    cb(null, entryStream);
  })
}

readStreams = (indexFilenames, cb) => {
  const merged = mergeStream();
  let i = 0;
  debug(`Reading ${indexFilenames.length} file indices`);
  function next() {
    if (i === indexFilenames.length) {
      return cb(null, merged);
    }
    const indexFilename = indexFilenames[i++];
    const t0 = Date.now();
    readStream(indexFilename, (err, entryStream) => {
      if (err) {
        debug(`Could not read file index stream of ${indexFilename}: ${err}. Skip it`);
        return next();
      }
      merged.add(entryStream);
      next();
    });
  }

  next();
}

module.exports = { readStream, readStreams };
