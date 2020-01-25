const path = require('path');
const mergeStream = require('merge-stream');
const debug = require('debug')('build:extract');

const readStream = require('../index/read-stream');

const processIndicator = require('../stream/process-indicator');
const filter = require('../stream/filter');
const mapToCatalogEntry = require('./map-catalog-entry');
const readMeta = require('../extract/read-meta');
const groupByDir = require('./group-by-dir');
const groupSidecarFiles = require('./group-sidecar-files');
const flatten = require('../stream/flatten');
const sort = require('../stream/sort');
const mapToMedia = require('./map-media');
const toList = require('../stream/to-list');
const writeCatalog = require('./write-catalog');

function getEntryStream(indexFilenames, cb) {
  const merged = mergeStream();
  let i = 0;

  function next() {
    if (i === indexFilenames.length) {
      return cb(null, merged);
    }
    const indexFilename = indexFilenames[i++];
    readStream(indexFilename, (err, entryStream) => {
      if (err) {
        debug(`Could not read file index stream of ${indexFilename}. Skip it`);
        return next();
      }
      merged.add(entryStream);
      next();
    });
  }

  next();
}

function build(indexFilenames, storageDir, catalogFilename, cb) {
  const t0 = Date.now();

  getEntryStream(indexFilenames, (err, entryStream) => {
    if (err) {
      return cb(err);
    }

    entryStream
      .pipe(filter(entry => entry.fileType === 'f' && entry.sha1sum && entry.size > 0 && !path.basename(entry.filename).match(/^\._/)))
      .pipe(mapToCatalogEntry)
      .pipe(readMeta(storageDir))
      .pipe(processIndicator({name: 'read meta'}))
      // stream entry list
      .pipe(toList())
      .pipe(sort(entry => path.dirname(entry.filename)))
      .pipe(flatten())
      .pipe(groupByDir)
      .pipe(processIndicator({name: 'read directories'}))
      .pipe(groupSidecarFiles)
      // stream single entry
      .pipe(flatten())
      .pipe(filter(entry => ['image', 'rawImage', 'video', 'sound'].indexOf(entry.type) >= 0))
      .pipe(mapToMedia)
      .pipe(processIndicator({name: 'map to media'}))
      .pipe(toList())
      .pipe(sort(entry => entry.date))
      .on('data', mediaList => {
         writeCatalog(catalogFilename, mediaList, (err, catalog) => {
           if (err) {
             return cb(err);
           }
           cb(null, catalog);
         });
      })
      .on('error', cb);

  })
}

module.exports = build;
