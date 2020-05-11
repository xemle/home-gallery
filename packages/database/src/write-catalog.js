const { writeJsonGzip } = require('@home-gallery/common');

function writeCatalog(catalogFilename, mediaList, cb) {
  const catalog = {
    type: 'catalog',
    version: 1,
    created: new Date().toISOString(),
    media: mediaList
  }

  writeJsonGzip(catalogFilename, catalog, cb);
}

module.exports = writeCatalog;