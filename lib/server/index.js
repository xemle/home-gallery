const fs = require('fs');
const path = require('path');
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const morgan = require('morgan');
const mcache = require('memory-cache');
const debug = require('debug')('server');

const readJsonGzip = require('../utils/read-json-gzip');

function shouldCompress (req, res) {
  if (req.headers['x-no-compression']) {
    return false
  }

  return compression.filter(req, res)
}

function watchCatalog(catalogFilename, cb) {
  readJsonGzip(catalogFilename, (err, data) => {
    if (err && err.code === 'ENOENT') {
      return cb(null, {entries: []});
    }
    cb(err, data);
  });

  fs.watch(catalogFilename, () => {
    setTimeout(() => {
      debug(`Catalog file ${catalogFilename} changed. Re-import it`);
      readJsonGzip(catalogFilename, cb);
    }, 250);
  })
}

function sanitizeInt(data, min, max, defaultValue) {
  const n = parseInt(data, 10);
  if (Number.isNaN(n)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(n, max));
}

function cache(duration) {
  const currentCache = new mcache.Cache();

  // credits to https://medium.com/the-node-js-collection/simple-server-side-cache-for-express-js-with-node-js-45ff296ca0f0
  const middleware = (req, res, next) => {
    let key = '__mcache__' + req.originalUrl || req.url
    let cachedBody = mcache.get(key)
    if (cachedBody) {
      res.send(cachedBody)
      return
    } else {
      res.sendResponse = res.send
      res.send = (body) => {
        mcache.put(key, body, duration * 1000);
        res.sendResponse(body)
      }
      next()
    }
  }

  const clear = () => {
    currentCache.clear();
  }

  return { middleware, clear };
}

function startServer(host, port, storageDir, catalogFilename, cb) {
  const app = express();

  let catalog = { media: [] };
  const catalogCache = cache(3600);

  watchCatalog(catalogFilename, (err, data) => {
    if (err) {
      debug(`Could not read catalog file ${catalogFilename}: ${err}`);
    } else {
      // unify media entries
      const idToEntry = data.media.reduce((result, value) => {
        if (!result[value.id]) {
          result[value.id] = value;
        }
        return result;
      }, Object.create({}));
      const entries = Object.values(idToEntry);
      entries.sort((a, b) => a.date < b.date ? 1 : -1);
      catalog.media = entries.slice(0, 200000);
      catalogCache.clear();
    }    
  })

  app.use(cors());
  app.use(compression({ filter: shouldCompress }))
  app.use('/files', express.static(storageDir, {index: false, maxAge: '2d', immutable: true}));

  app.use(morgan('tiny'));
  app.get('/api', catalogCache.middleware, function (req, res) {
    if (req.query.offset || req.query.limit) {
      const length = catalog.media.length;
      const offset = sanitizeInt(req.query.offset, 0, length, 0);
      const limit = sanitizeInt(req.query.limit, Math.min(10, length), length, length);
      const media = catalog.media.slice(offset, offset + limit);
      res.send(Object.assign({}, catalog, { limit, offset, media }));
    } else {
      res.send(catalog);
    }
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
