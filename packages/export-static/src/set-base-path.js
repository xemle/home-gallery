const path = require('path');

const log = require('@home-gallery/logger')('export.webapp.basePath');

const rewriteFile = require('./rewrite-file');

const trimSlashes = s => s.replace(/(^\/+|\/+$)/g, '')

const setBasePath = (dir, basePath, cb) => {
  const trimmedBasePath = trimSlashes(basePath)
  if (!trimmedBasePath.length) {
    return cb(null, dir);
  }
  const t0 = Date.now();
  const indexFilename = path.join(dir, basePath, 'index.html')
  const base = `/${trimmedBasePath}/`
  rewriteFile(indexFilename, data => {
    return data.replace(/<base [^>]+>/, `<base href="${base}">`)
  }, (err) => {
    if (err) {
      return cb(err);
    }
    log.info(t0, `Set base path to ${base}`)
    cb(null, dir)
  });
}

module.exports = setBasePath;