const fs = require('fs');
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const debug = require('debug')('server');

const readJsonGzip = require('../utils/read-json-gzip');

function shouldCompress (req, res) {
  if (req.headers['x-no-compression']) {
    return false
  }

  return compression.filter(req, res)
}

function watchCatalog(catalogFilename, cb) {
  readJsonGzip(catalogFilename, cb);

  fs.watchFile(catalogFilename, { interval: 1000 }, () => {
    debug(`Catalog file ${catalogFilename} changed. Re-import it`);
    readJsonGzip(catalogFilename, cb);
  })
}

function startServer(host, port, storageDir, catalogFilename, cb) {
  const app = express();

  let catalog = {};

  watchCatalog(catalogFilename, (err, data) => {
    if (err) {
      debug(`Could not read catalog file ${catalogFilename}: ${err}`);
    } else {
      catalog = Object.assign({}, data);
      catalog.media.sort((a, b) => a.date < b.date ? 1 : -1);
      catalog.media = catalog.media.slice(0, 200000);
    }    
  })

  app.use(cors());
  app.use(compression({ filter: shouldCompress }))
  app.use('/files', express.static(storageDir));

  app.get('/api', function (req, res) {
    res.send(catalog);
  });
  
  app.use('/', express.static('./dist/webapp'));

  app.listen(port, host)
    .on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        console.log(`Address is already in use!`);
      }
      cb(e);
    })
    .on('listening', () => {
      console.log(`Open CloudGallery on http://localhost:${port}`);
      cb(null, app);
    })
  
}

module.exports = startServer;
