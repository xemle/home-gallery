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
const { augmentReqByUserMiddleware, createBasicAuthMiddleware, defaultIpWhitelistRules } = require('./auth')
const { isIndex, skipIf } = require('./utils')

const log = require('@home-gallery/logger')('server')
const openCb = callbackify(open)
const eventbus = new EventBus()

const webappDir = path.join(__dirname, 'public')

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

const getAuthMiddleware = config => {
  const users = config.server?.auth?.users || []
  const rules = config.server?.auth?.rules || defaultIpWhitelistRules
  if (users.length) {
    return createBasicAuthMiddleware(users, rules)
  }
  return (req, _, next) => next()
}

function startServer(options, cb) {
  const { config } = options

  const app = express();
  app.disable('x-powered-by')
  app.enable('trust proxy')

  app.use(augmentReqByUserMiddleware())
  app.use(loggerMiddleware())
  app.use(cors());
  app.use(compression({ filter: shouldCompress }))

  app.use(skipIf(express.static(webappDir), isIndex))

  app.use(getAuthMiddleware(config))

  app.use('/files', express.static(config.storage.dir, {index: false, maxAge: '2d', immutable: true}));
  app.use(bodyParser.json({limit: '1mb'}))

  const { read: readEvents, push: pushEvent, stream, getEvents } = eventsApi(eventbus, config.events.file);
  const { read: readDatabase, init: initDatabase, getFirstEntries } = databaseApi(eventbus, config.database.file, getEvents);
  app.get('/api/events.json', readEvents);
  app.get('/api/events/stream', stream);
  app.post('/api/events', pushEvent);
  app.get('/api/database.json', readDatabase);

  if (config.server.remoteConsoleToken) {
    const debugApi = require('./api/debug')({remoteConsoleToken: config.server?.remoteConsoleToken})
    app.post('/api/debug/console', debugApi.console);
  }

  // deprecated
  app.get('/api/database', readDatabase);
  app.get('/api/events', readEvents);

  app.use(webapp(webappDir, req => ({
    disabled: !!req.user ? ['pwa'] : [],
    entries: getFirstEntries(50)
  }), {
    basePath: config.server.basePath || '/',
    injectRemoteConsole: !!config.server.remoteConsoleToken
  }));

  const server = createServer(config.server.key, config.server.cert, app);
  server.listen(config.server.port, config.server.host)
    .on('error', err => {
      if (err.code === 'EADDRINUSE') {
        log.error(`Listening port ${config.server.port} is already in use!`);
      }
      cb(err);
    })
    .on('listening', () => {
      const url = serverUrl(config.server.port, config.server.key, config.server.cert)
      log.info(`Your own Home Gallery is running at ${url}`);
      initDatabase();
      if (config.server.openBrowser) {
        log.debug(`Open browser with url ${url}`)
        return openCb(url, () => cb(null, server))
      }
      cb(null, server);
    })

  process.once('SIGINT', () => {
    log.trace(`Closing server due SIGINT`)
    server.closeIdleConnections()
    server.closeAllConnections()
    server.close(err => {
      if (err) {
        log.error(err, `Failed to close server by SIGINT`)
      } else {
        log.debug(err, `Server closed successfully by SIGINT`)
      }
    });
  })
}

module.exports = {
  startServer,
  webappDir
};
