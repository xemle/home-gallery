const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const { PassThrough, Transform } = require('stream')
const split2 = require('split2');
const debug = require('debug')('index:readStream');

const { map } = require('@home-gallery/stream')

const readHead = (filename, chunk, next) => {
  const [headData, entry] = chunk.split('data":[{');
  let head;
  let headJson;
  try {
    headJson = headData + 'data":[]}';
    head = JSON.parse(headJson);
    if (!head || !head.type || head.type != 'home-gallery/fileindex@1.0') {
      next(new Error(`Unknown file index format ${head && head.type || 'unknown'} for index file '${filename}'. Please read CHANGELOG and migrate!`))
      return [head, false]
    }
    return [head, entry];
  } catch (e) {
    next(new Error(`Could not parse head JSON of index file '${filename}': ${e}. Data: ${headJson.substr(0, 160)}`));
    return [head, false]
  }
}

const isLastEntry = (data, tail) => data.substring(data.length - tail.length) == tail
const stripLastEntry = (data, tail) => isLastEntry(data, tail) ? data.substring(0, data.length - tail.length) : data

const parseJsonChunks = (filename) => {
  let isHead = true
  let entryIndex = 0;
  return Transform({
    objectMode: true,
    transform: function (chunk, enc, next) {
      if (isHead) {
        isHead = false
        const [head, entry] = readHead(filename, chunk, next)
        if (entry === false) {
          return;
        }
        this.emit('head', head)
        chunk = entry;
      } 
      let entryJson = '{' + stripLastEntry(chunk, '}]}') + '}'
      let entry;
      try {
        entry = JSON.parse(entryJson)
      } catch (e) {
        return next(new Error(`Could not parse entry JSON for file index '${filename}', entry index ${entryIndex}: ${e}. Data: ${entryJson.substr(0, 160)}`));
      }
      this.push(entry)
      entry = null;
      entryJson = null;
      chunk = null;
      entryIndex++;
      next()
    }
  });
}

const readStream = (indexFilename, cb) => {
  debug(`Reading file index from ${filename}`)
  const indexName = path.basename(indexFilename).replace(/\.[^.]+$/, '');
  let index;
  const stream = fs.createReadStream(indexFilename)
    .pipe(zlib.createGunzip())
    .pipe(split2('},{'))
    .pipe(parseJsonChunks(indexFilename)).on('head', head => index = head)
    .pipe(map(e => Object.assign(e, { indexName, url: `file://${path.join(index.base, e.filename)}` })))

  cb(null, stream)
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
        debug(`Could not read file index '${filename}': ${err}. Continue`)
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
