const fs = require('fs');
const path = require('path');
const debug = require('debug')('export:inject-config');

const injectWebappConfig = (outputDirectory, webappConfig, cb) => {
  const t0 = Date.now();
  const indexFilename = path.join(outputDirectory, 'index.html')
  fs.readFile(indexFilename, {encoding: 'utf8'}, (err, data) => {
    if (err) {
      const e = new Error(`Could not read index.html to in inject config: ${err}`)
      debug(e.message);
      return cb(e)
    }

    const script = `<script>window['__home-gallery']=${JSON.stringify(webappConfig)};</script>`;
    const injected = data.replace('</head>', `${script}</head>`);
    fs.writeFile(indexFilename, injected, {encoding: 'utf8'}, (err) => {
      if (err) {
        const err = new Error(`Could not update index.html to in inject config: ${err}`)
        debug(err.message);
        return cb(err)
      }
      debug(`Injected config to index.html in ${Date.now() - t0}ms`);
      cb(null, outputDirectory);
    })
  })
}

module.exports = injectWebappConfig;