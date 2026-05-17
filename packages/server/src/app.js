// @ts-nocheck
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
import { sourcesApi } from './api/sources.js';
import { webapp } from './webapp.js';
import { augmentReqByUserMiddleware, createAuthContext, authMiddleware } from './auth/index.js'
import { isIndex, skipIf, browserBasePath, routerPrefix } from './utils.js'
import { debugApi } from './api/debug/index.js'
import { browserPlugins } from './browser-plugins.js';
import { authApi } from './api/auth/index.js'
import { createSessionStore } from './auth/session/session-store.js'
import Logger from '@home-gallery/logger';
import { webappMiddleware } from './webapp-middleware.js';
import { socialMetaTagsMiddleware } from './social-meta-tags-middleware.js';
import { createCookieMiddleware } from './auth/session/cookie-middleware.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const webappDir = path.join(__dirname, 'public')

const log = Logger('server.app')

function shouldCompress (req, res) {
  if (req.headers['x-no-compression']) {
    return false
  }

  return compression.filter(req, res)
}

/**
 * @param {import('./types.js').TServerContext} context
 */
export async function createApp(context) {
  const { config } = context
  const app = context.app = express();
  app.disable('x-powered-by')
  app.enable('trust proxy')

  const router = context.router = express.Router()

  context.auth = await createAuthContext(config)
  createCookieMiddleware(context)
  app.use(augmentReqByUserMiddleware(context))
  app.use(loggerMiddleware())

  router.use(cors());
  router.use(compression({ filter: shouldCompress }))

  router.use(skipIf(express.static(webappDir, {maxAge: '1h'}), isIndex))
  router.use(bodyParser.json({limit: '1mb'}))

  // Auth API routes must be registered before the auth middleware allow login for unauthenticated requests
  await authApi(context)
  authMiddleware(context)

  router.use('/files', express.static(config.storage.dir, {index: false, maxAge: '2d', immutable: true}));

  await browserPlugins(context)

  await eventsApi(context)
  await databaseApi(context)
  await treeApi(context)
  await sourcesApi(context)
  await debugApi(context)

  await webappMiddleware(context)
  await socialMetaTagsMiddleware(context)
  await webapp(context)

  const prefix = routerPrefix(config.server?.prefix)
  app.use(prefix, router)

  if (prefix != '/') {
    log.info(`Set prefix to ${prefix}`)
    app.get('/', (_, res) => res.redirect(prefix))
  }

  return {
    app
  }
}
