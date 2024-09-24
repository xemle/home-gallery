import fs from 'fs';
import http from 'http';
import https from 'https';
import open from 'open'

import { ProcessManager } from '@home-gallery/common'

import Logger from '@home-gallery/logger'
import { createPluginManager, QueryExecutor } from '@home-gallery/plugin'

const log = Logger('server')

import { EventBus } from './eventbus.js';
import { createApp } from './app.js'
import { spawnCli } from './utils/spawn-cli.js'

export { getPluginFiles } from './plugins.js'

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

const serverUrl = (config) => {
  const { port, key, cert } = config.server
  return `${isHttps(key, cert) ? 'https' : 'http'}://localhost:${port}`
}

const getConfigEnv = options => {
  const { configFile, autoConfigFile } = options
  return !autoConfigFile && configFile ? {GALLERY_CONFIG: configFile} : {}
}

const shutdown = (server, processManager) => {
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
  return processManager.killAll('SIGINT')
}

/**
 * @param {import('@home-gallery/types').TPluginManager} manager
 * @returns {import('./types.js').TExecuteQueryFn}
 */
const createQueryExecutor = (manager) => {
  /** @type {import('@home-gallery/types').TQueryPlugin[]} */
  const queryPlugins = manager.getExtensions().filter(e => e.type == 'query').map(e => e.extension);
  const queryExecutor = new QueryExecutor()
  queryExecutor.addQueryPlugins(queryPlugins);
  return (entries, query, context) => queryExecutor.execute(entries, query, context)
}

export async function startServer(options) {
  const { config } = options

  const context = {
    type: 'serverContext',
    plugin: {},
    config,
    eventbus: new EventBus(),
    processManager: new ProcessManager(),
  }
  /** @type {import('@home-gallery/types').TGalleryPluginManager} */
  const pluginManager = await createPluginManager(options.config, context)
  context.pluginManager = pluginManager
  context.executeQuery = createQueryExecutor(pluginManager)

  const { app, initDatabase } = createApp(context)

  return new Promise((resolve, reject) => {
    const { key, cert, port, host } = config.server
    const server = createServer(key, cert, app);
    server.listen(port, host)
      .on('error', err => {
        if (err.code === 'EADDRINUSE') {
          log.error(`Listening port ${port} is already in use!`);
        }
        reject(err)
      })
      .on('listening', () => resolve(server))
    }).then(async server => {
      const { watchSources, openBrowser } = config.server
      const url = serverUrl(config)
      log.info(`Your own Home Gallery is running at ${url}`);
      initDatabase();
      if (watchSources) {
        const watcher = spawnCli('run import --initial --update --watch'.split(' '), getConfigEnv(options))
        context.processManager.addProcess(watcher, 15 * 1000)
      }
      if (openBrowser) {
        log.debug(`Open browser with url ${url}`)
        await open(url)
      }
      return [server, () => shutdown(server, context.processManager)]
    })

}
