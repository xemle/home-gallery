const path = require('path');
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const bodyParser = require('body-parser');
const open = require('open')

const { callbackify } = require('@home-gallery/common')

const { loggerMiddleware } = require('./logger-middleware')
const { EventBus } = require('./eventbus');
const databaseApi = require('./api/database');
const eventsApi = require('./api/events');
const webapp = require('./webapp');
const { augmentReqByUserMiddleware, createBasicAuthMiddleware } = require('./auth')
const { isIndex, skipIf } = require('./utils')

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

const getAuthMiddleware = options => {
  if (options.users?.length) {
    return createBasicAuthMiddleware(options.users, options.ipWhitelistRules || defaultIpWhitelistRules)
  }
  return (req, _, next) => next()
}

function startServer(options, cb) {
  const {host, port, storageDir, databaseFilename, eventsFilename, webappDir, key, cert, openBrowser} = options
  const app = express();
  app.disable('x-powered-by')
  app.enable('trust proxy')

  app.use(augmentReqByUserMiddleware())
  app.use(loggerMiddleware())
  app.use(cors());
  app.use(compression({ filter: shouldCompress }))

  app.use(skipIf(express.static(webappDir), isIndex))

  app.use(getAuthMiddleware(options))

  app.use('/files', express.static(storageDir, {index: false, maxAge: '2d', immutable: true}));
  app.use(bodyParser.json({limit: '1mb'}))

  const { read: readEvents, push: pushEvent, stream, getEvents } = eventsApi(eventbus, eventsFilename);
  const { read: readDatabase, init: initDatabase, getFirstEntries } = databaseApi(eventbus, databaseFilename, getEvents);
  app.get('/api/events.json', readEvents);
  app.get('/api/events/stream', stream);
  app.post('/api/events', pushEvent);
  app.get('/api/database.json', readDatabase);

  // deprecated
  app.get('/api/database', readDatabase);
  app.get('/api/events', readEvents);

  app.use(webapp(webappDir, req => ({
    disablePwa: !!req.user,
    entries: getFirstEntries(50)
  })));

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
      initDatabase();
      if (openBrowser) {
        log.debug(`Open browser with url ${url}`)
        return openCb(url, () => cb(null, app))
      }
      cb(null, app);
    })

}

module.exports = { startServer, webappDir: path.join(__dirname, 'public') };
