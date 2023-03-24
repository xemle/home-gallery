const open = require('open')

const { callbackify } = require('@home-gallery/common')

const log = require('@home-gallery/logger')('server')
const openCb = callbackify(open)

const { createApp } = require('./app')

const isHttps = (key, cert) => key && cert

function createServer(key, cert, app) {
  if (isHttps(key, cert)) {
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

const serverUrl = (port, key, cert) =>`${isHttps(key, cert) ? 'https' : 'http'}://localhost:${port}`

function startServer(options, cb) {
  const { config } = options

  const { app, initDatabase } = createApp(config)

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
    log.trace(`Stopping server`)
    server.closeIdleConnections()
    server.closeAllConnections()
    server.close(err => {
      if (err) {
        log.error(err, `Failed to stop server: ${err}`)
      } else {
        log.debug(`Server stopped successfully`)
      }
    });
  })
}

module.exports = {
  startServer,
};
