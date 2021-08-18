const path = require('path');
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const bodyParser = require('body-parser');
const open = require('open')

const logger = require('@home-gallery/logger')
const { callbackify } = require('@home-gallery/common')

const { loggerMiddleware } = require('./logger-middleware')
const { EventBus } = require('./eventbus');
const databaseApi = require('./api/database');
const eventsApi = require('./api/events');
const webapp = require('./webapp');

const log = require('@home-gallery/logger')('server')
const openCb = callbackify(open)
const eventbus = new EventBus()

function shouldCompress (req, res) {
  if (req.headers['x-no-compression']) {
    return false
  }

  return compression.filter(req, res)
}

function createServer(key, cert, app) {
  if (key && cert) {
    const fs = require('fs');
    const https = require('https');
    var privateKey  = fs.readFileSync(key, 'utf8');
    var certificate = fs.readFileSync(cert, 'utf8');

    var credentials = {key: privateKey, cert: certificate};

    return https.createServer(credentials, app);
  } else {
    const http = require('http');
    return http.createServer({spdy: { plain: true, ssl: false} }, app);
  }
}

const serverUrl = (port, key, cert) =>`${key && cert ? 'https' : 'http'}://localhost:${port}`

function startServer(options, cb) {
  const {host, port, storageDir, databaseFilename, eventsFilename, webappDir, key, cert, openBrowser} = options
  const app = express();
  app.disable('x-powered-by');

  app.use(loggerMiddleware())
  app.use(cors());
  app.use(compression({ filter: shouldCompress }))
  app.use('/files', express.static(storageDir, {index: false, maxAge: '2d', immutable: true}));

  app.use(bodyParser.json({limit: '1mb'}))

  const { read, push, stream } = eventsApi(eventbus, eventsFilename);
  const { read: dbRead, init: dbInit, getFirstEntries } = databaseApi(eventbus);
  app.get('/api/database.json', dbRead);
  app.get('/api/events.json', read);
  app.get('/api/events/stream', stream);
  app.post('/api/events', push);

  // deprecated
  app.get('/api/database', dbRead);
  app.get('/api/events', read);

  app.use(webapp(webappDir, getFirstEntries, 50));

  const server = createServer(key, cert, app);
  server.listen(port, host)
    .on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        log.error(`Address is already in use!`);
      }
      cb(e);
    })
    .on('listening', () => {
      const url = serverUrl(port, key, cert)
      log.info(`Open Home Gallery on ${url}`);
      dbInit(databaseFilename);
      if (openBrowser) {
        log.debug(`Open browser with url ${url}`)
        return openCb(url, () => cb(null, app))
      }
      cb(null, app);
    })

}

module.exports = { startServer, webappDir: path.join(__dirname, 'public') };
