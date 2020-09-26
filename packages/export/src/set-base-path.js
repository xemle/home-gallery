const path = require('path');
const debug = require('debug')('export:set-base-path')

const rewriteFile = require('./rewrite-file');

const trimSlashes = s => s.replace(/(^\/+|\/+$)/g, '')

const setBasePath = (outputDirectory, basePath, cb) => {
  const trimmedBasePath = trimSlashes(basePath)
  if (!trimmedBasePath.length) {
    return cb(null, outputDirectory);
  }
  const t0 = Date.now();
  const indexFilename = path.join(outputDirectory, basePath, 'index.html')
  const base = `/${trimmedBasePath}/`
  rewriteFile(indexFilename, data => {
    return data.replace(/<base [^>]+>/, `<base href="${base}">`)
  }, (err) => {
    if (err) {
      return cb(err);
    }
    debug(`Set base path to ${base} in ${Date.now() - t0}ms`)
    cb(null, outputDirectory)
  });
}

module.exports = setBasePath;