const path = require('path');
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const bodyParser = require('body-parser');
const pinoHttp = require('pino-http')
const open = require('open')

const logger = require('@home-gallery/logger')
const { callbackify } = require('@home-gallery/common')
const databaseApi = require('./api/database');
const eventsApi = require('./api/events');
const webapp = require('./webapp');

const log = logger('server')
const openCb = callbackify(open)

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

const createLogger = () => {
  const customMessage = log => `${log.statusCode} ${log.req.method} ${log.req.url} ${Date.now() - log[pinoHttp.startTime]}ms`

  return pinoHttp({
    logger: logger('server.request'),
    customLogLevel: (res, err) => {
      if (res.statusCode >= 400 && res.statusCode < 500) {
        return 'warn'
      } else if (res.statusCode >= 500 || err) {
        return 'error'
      } else if (res.req.originalUrl.startsWith('/files')) {
        return 'debug'
      }
      return 'info'
    },
    customSuccessMessage: customMessage,
    customErrorMessage: (err, o) => customMessage(o)
  })
}

const serverUrl = (port, key, cert) =>`${key && cert ? 'https' : 'http'}://localhost:${port}`

function startServer(options, cb) {
  const {host, port, storageDir, databaseFilename, eventsFilename, webappDir, key, cert, openBrowser} = options
  const app = express();
  app.disable('x-powered-by');

  app.use(createLogger())
  app.use(cors());
  app.use(compression({ filter: shouldCompress }))
  app.use('/files', express.static(storageDir, {index: false, maxAge: '2d', immutable: true}));

  app.use(bodyParser.json({limit: '1mb'}))

  const { read, push, stream, eventbus } = eventsApi(eventsFilename);
  const { read: dbRead, init: dbInit, getEntries } = databaseApi(eventbus);
  app.get('/api/database', dbRead);
  app.get('/api/events', read);
  app.get('/api/events/stream', stream);
  app.post('/api/events', push);

  app.use(webapp(webappDir, getEntries, 50));

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
