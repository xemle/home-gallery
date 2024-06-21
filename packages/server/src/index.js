import fs from 'fs';
import http from 'http';
import https from 'https';
import open from 'open'

import { callbackify, ProcessManager } from '@home-gallery/common'

import Logger from '@home-gallery/logger'

const log = Logger('server')
const openCb = callbackify(open)

import { createApp } from './app.js'
import { spawnCli } from './utils/spawn-cli.js'

const isHttps = (key, cert) => key && cert

function createServer(key, cert, app) {
  if (isHttps(key, cert)) {
    var privateKey  = fs.readFileSync(key, 'utf8');
    var certificate = fs.readFileSync(cert, 'utf8');

    var credentials = {key: privateKey, cert: certificate};

    return https.createServer(credentials, app);
  } else {
    return http.createServer({spdy: { plain: true, ssl: false} }, app);
  }
}

const serverUrl = (port, key, cert) =>`${isHttps(key, cert) ? 'https' : 'http'}://localhost:${port}`

const getConfigEnv = options => {
  const { configFile, autoConfigFile } = options
  return !autoConfigFile && configFile ? {GALLERY_CONFIG: configFile} : {}
}

export function startServer(options, cb) {
  const { config } = options

  const pm = new ProcessManager()
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
      if (config.server.watchSources) {
        const watcher = spawnCli('run import --initial --update --watch'.split(' '), getConfigEnv(options))
        pm.addProcess(watcher, 15 * 1000)
      }
      if (config.server.openBrowser) {
        log.debug(`Open browser with url ${url}`)
        return openCb(url, () => cb(null, server))
      }
      cb(null, server);
    })

  server.shutdown = async () => {
    // use closeAllConnections from node >= v18.2.0
    if (typeof server?.closeAllConnections == 'function') {
      server.closeIdleConnections()
      server.closeAllConnections()
    }
    server.close(err => {
      if (err) {
        log.error(err, `Failed to stop server: ${err}`)
      }
    });
    return pm.killAll('SIGINT')
  }

}
