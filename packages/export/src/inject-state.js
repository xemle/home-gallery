const path = require('path');

const log = require('@home-gallery/logger')('export.webapp.injectState');

const rewriteFile = require('./rewrite-file');

const injectState = (database, outputDirectory, basePath, cb) => {
  const t0 = Date.now();
  const indexFilename = path.join(outputDirectory, basePath, 'index.html')
  rewriteFile(indexFilename, data => {
    const state = {
      entries: database.data.slice(0, 50)
    };
    return data.replace('window.__homeGallery={}', `window.__homeGallery=${JSON.stringify(state)}`);
  }, (err) => {
    if (err) {
      return cb(err);
    }
    log.info(t0, `Inject state`)
    cb(null, outputDirectory, basePath)
  });
}

module.exports = injectState;