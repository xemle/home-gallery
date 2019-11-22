const express = require('express');
const compression = require('compression');
const debug = require('debug')('server');

const readJsonGzip = require('../utils/read-json-gzip');

function shouldCompress (req, res) {
  if (req.headers['x-no-compression']) {
    return false
  }

  return compression.filter(req, res)
}

function readCatalog(catalogFilename, cb) {
  readJsonGzip(catalogFilename, cb);
}

function startServer(catalogFilename, storageDir, port, cb) {
  const app = express();

  let catalog = {};

  readCatalog(catalogFilename, (err, data) => {
    if (err) {
      debug(`Could not read catalog file ${catalogFilename}: ${err}`);
    } else {
      catalog = data;
    }
  })

  app.use(compression({ filter: shouldCompress }))
  app.use('/files', express.static(storageDir));

  app.get('/api', function (req, res) {
    res.send(catalog);
  });
  
  app.listen(port, function () {
    console.log(`Open CloudGallery on http://localhost:${port}`);
  });
  
  cb(null, app);
}

module.exports = startServer;