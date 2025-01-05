import path from 'path';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url'

import { loggerMiddleware } from './logger-middleware.js'
import { databaseApi } from './api/database/index.js';
import { treeApi } from './api/database/tree/index.js';
import { eventsApi } from './api/events/index.js';
import { getSourcesApi } from './api/sources.js';
import { webapp } from './webapp.js';
import { augmentReqByUserMiddleware, createBasicAuthMiddleware, defaultIpWhitelistRules } from './auth/index.js'
import { isIndex, skipIf } from './utils.js'
import { debugApi } from './api/debug/index.js'
import { browserPlugin } from './browser-plugins.js';
import Logger from '@home-gallery/logger';

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const webappDir = path.join(__dirname, 'public')

const log = Logger('server.app')

function shouldCompress (req, res) {
  if (req.headers['x-no-compression']) {
    return false
  }

  return compression.filter(req, res)
}

const getAuthMiddleware = config => {
  const users = config.server?.auth?.users || []
  const rules = config.server?.auth?.rules || defaultIpWhitelistRules
  if (users.length) {
    return createBasicAuthMiddleware(users, rules)
  }
  return (req, _, next) => next()
}

/**
 * Ensure leading and tailing slash. Allow base path with schema like http://foo.com/bar
 */
const browserBasePath = basePath => {
  let path = `${basePath || '/'}`
  if (!path.startsWith('/') && path.indexOf('://') < 0) {
    path = '/' + path
  }
  return path.endsWith('/') ? path : path + '/'
}

const routerPrefix = basePath => {
  let path = browserBasePath(basePath)
  return path.match(/[^/]\/$/) ? path.substring(0, path.length - 1) : path
}


/**
 * @param {import('./types.js').TServerContext} context
 */
export function createApp(context) {
  const { config } = context
  const app = express();
  app.disable('x-powered-by')
  app.enable('trust proxy')
  app.use(loggerMiddleware())

  const router = express.Router()
  router.use(augmentReqByUserMiddleware())
  router.use(cors());
  router.use(compression({ filter: shouldCompress }))

  router.use(skipIf(express.static(webappDir, {maxAge: '1h'}), isIndex))

  router.use(getAuthMiddleware(config))

  router.use('/files', express.static(config.storage.dir, {index: false, maxAge: '2d', immutable: true}));

  const pluginApi = browserPlugin(context, '/plugins/')
  router.use('/plugins', pluginApi.static)

  router.use(bodyParser.json({limit: '1mb'}))

  const { read: readEvents, push: pushEvent, stream, getEvents } = eventsApi(context, config.events.file);
  const { read: readDatabase, init: initDatabase, getFirstEntries, getDatabase } = databaseApi(context, config.database.file, getEvents);
  const { read: readTree } = treeApi(context, getDatabase);

  router.get('/api/events.json', readEvents);
  router.get('/api/events/stream', stream);
  router.post('/api/events', pushEvent);
  router.get('/api/database.json', readDatabase);
  router.get('/api/database/tree/:hash', readTree);
  router.use('/api/sources', getSourcesApi(config))

  if (config.server.remoteConsoleToken) {
    const { console } = debugApi({remoteConsoleToken: config.server?.remoteConsoleToken})
    router.post('/api/debug/console', console);
  }

  // deprecated
  router.get('/api/database', readDatabase);
  router.get('/api/events', readEvents);

  const getWebAppState = async (req) => {
    const disabled = config?.webapp?.disabled || []
    const plugins = pluginApi.pluginEntries
    const entries = await getFirstEntries(50, req)
    const sources = config.sources
      .filter(source => source.downloadable && !source.offline)
      .map(source => {
        const indexName = path.basename(source.index).replace(/\.[^.]+$/, '')
        return {
          indexName,
          downloadable: true,
        }
    });
    return {
      disabled: !!req.username ? [...disabled, 'pwa'] : disabled,
      pluginManager: {
        plugins
      },
      entries,
      sources,
    }
  }

  const webAppOptions = {
    basePath: browserBasePath(config.server.prefix || config.server.basePath),
    injectRemoteConsole: !!config.server.remoteConsoleToken,
  }

  router.use(webapp(webappDir, getWebAppState, webAppOptions))

  const prefix = routerPrefix(config.server.prefix)
  app.use(prefix, router)


  if (prefix != '/') {
    log.info(`Set prefix to ${prefix}`)
    app.get('/', (_, res) => res.redirect(prefix))
  }

  return {
    app,
    initDatabase
  }
}
