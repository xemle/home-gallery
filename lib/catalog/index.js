const debug = require('debug')('catalog:extract');

const readStream = require('../index/read-stream');

const processIndicator = require('./process-indicator');
const filter = require('./filter');
const mapToCatalogEntry = require('./map-catalog-entry');
const readMeta = require('./read-meta');
const groupDir = require('./group-dir');
const groupSidecarFiles = require('./group-sidecar-files');
const listToItems = require('./map-list-to-items');
const mapToMedia = require('./map-media');
const mapToArray = require('./map-array');
const writeCatalog = require('./write-catalog');

function extract(indexFilename, storageDir, catalogFilename, cb) {
  const t0 = Date.now();

  readStream(indexFilename, (err, entryStream) => {
    if (err) {
      return cb(err);
    }

    entryStream
      .pipe(filter(entry => entry.fileType === 'f' && entry.sha1sum && !entry.filename.match(/^\._/)))
      .pipe(mapToCatalogEntry)
      .pipe(readMeta(storageDir))
      .pipe(processIndicator({name: 'read meta'}))
      // stream entry list
      .pipe(groupDir)
      .pipe(processIndicator({name: 'read directories'}))
      .pipe(groupSidecarFiles)
      // stream single entry
      .pipe(listToItems)
      .pipe(filter(entry => ['image', 'rawImage', 'video', 'sound'].indexOf(entry.type) >= 0))
      .pipe(mapToMedia)
      .pipe(processIndicator({name: 'map to media'}))
      .pipe(mapToArray)
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

  })
}

module.exports = extract;