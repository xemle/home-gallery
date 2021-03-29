const path = require('path');
const { Readable, PassThrough } = require('stream');
const debug = require('debug')('index:readStream');

const readIndex = require('./read');

const by = keyFn => (a, b) => keyFn(a) < keyFn(b) ? -1 : 1
const byDir = by(e => path.dirname(e.filename))

const readStream = (indexFilename, cb) => {
  const t0 = Date.now();
  readIndex(indexFilename, (err, index) => {
    if (err) {
      return cb(err);
    }

    const indexName = path.basename(indexFilename).replace(/\.[^.]+$/, '');
    let entries = index.data
      .sort(byDir)
      .map(e => Object.assign(e, { indexName, url: `file://${path.join(index.base, e.filename)}` }))

    const entryStream = Readable.from(entries)
    debug(`Read file index from ${indexFilename} with ${entries.length} entries in ${Date.now() - t0}ms`);
    entries = null;
    index = null;
    process.nextTick(() => cb(null, entryStream));
  })
}

const appendStream = (nextStream) => {
  const output  = new PassThrough({objectMode: true})

  output.setMaxListeners(0)

  const append = stream => {
    if (!stream) {
      return output.readable && output.end()
    }
    stream.once('end', () => nextStream(append))
    stream.once('error', output.emit.bind(output, 'error'))
    stream.pipe(output, {end: false})
  }

  nextStream(append);
  return output
}

const readStreams = (indexFilenames, cb) => {
  let i = 0;
  const nextStream = (cb) => {
    if (i == indexFilenames.length) {
      return cb();
    }
    const filename = indexFilenames[i++]
    readStream(filename, (err, stream) => {
      if (!err) {
        return cb(stream);
      } else if (i < indexFilenames.length) {
        debug(`Could not read index ${filename}: ${err}. Continue`)
        return nextStream(cb)
      } else {
        return cb();
      }
    })
  }

  const stream = appendStream(nextStream);
  cb(null, stream);
}


module.exports = { readStream, readStreams };
