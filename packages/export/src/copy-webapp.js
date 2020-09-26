const path = require('path');
const cpx = require("cpx");
const debug = require('debug')('export:copy-webapp');

const copyWebapp = (outputDirectory, basePath, cb) => {
  const t0 = Date.now();
  const webappSrc = path.join(__dirname, 'public/**/*');
  const directory = path.join(outputDirectory, basePath);
  cpx.copy(webappSrc, directory, (err) => {
    if (err) {
      debug(`Could not copy webapp sources to ${directory}: ${err}`);
      return cb(err);
    }
    debug(`Copied webapp sources to ${directory} in ${Date.now() - t0}ms`);
    cb(null, outputDirectory, basePath);
   });
}

module.exports = copyWebapp;
