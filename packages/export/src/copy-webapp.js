const path = require('path');
const cpx = require("cpx");
const debug = require('debug')('export:copy-webapp');

const copyWebapp = (outputDirectory, cb) => {
  const t0 = Date.now();
  const webappSrc = path.join(__dirname, 'public/**/*');
  cpx.copy(webappSrc, outputDirectory, (err) => {
    if (err) {
      debug(`Could not copy webapp sources to ${outputDirectory}: ${err}`);
      return cb(err);
    }
    debug(`Copied webapp sources to ${outputDirectory} in ${Date.now() - t0}ms`);
    cb(null, outputDirectory);
   });
}

module.exports = copyWebapp;
