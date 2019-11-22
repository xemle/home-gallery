const fs = require('fs');
const path = require('path');
const Stream = require('stream')

const debug = require('debug')('catalog:extract');

const readIndex = require('../index/read');

const readMeta = require('./read-meta');
const groupDir = require('./group-dir');
const groupExtension = require('./group-extension');
const primaryFile = require('./primary-file');
const createMedia = require('./create-media');
const mapMediaList = require('./map-media-list');
const writeCatalog = require('./write-catalog');

function extract(indexFilename, storageDir, catalogFilename, cb) {
  const t0 = Date.now();

  readIndex(indexFilename, (err, index) => {
    if (err) {
      return cb(err);
    }

    const base = index.base;
    const entries = index.entries
      .filter(entry => entry.fileType === 'f' && entry.sha1sum && !path.basename(entry.filename).match(/^\._/))
      .map(({sha1sum, filename, size}) => Object.create({ sha1sum, size, base: `file://${base}`, filename, files: [], data: {}}))
    const entryStream = new Stream.Readable({objectMode: true});

    entryStream
      .pipe(readMeta(storageDir))
      .pipe(groupDir)
      .pipe(groupExtension)
      .pipe(primaryFile)
      .pipe(createMedia(['image', 'rawImage', 'video', 'sound']))
      .pipe(mapMediaList)
      .on('data', mediaList => {
         writeCatalog(catalogFilename, mediaList, (err, catalog) => {
           if (err) {
             return cb(err);
           }
           debug(`Created catalog ${catalogFilename} in ${Date.now() - t0}ms`);
           cb(null, catalog);
         });
      })
      .on('error', (err) => {
        debug(`Could not create catalog: ${err}`);
      });

    entries.forEach(item => entryStream.push(item))
    entryStream.push(null)
  
  })
}

module.exports = extract;