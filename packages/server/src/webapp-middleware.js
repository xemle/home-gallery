import path from 'path';
import { browserBasePath } from './utils.js'
import { deepMerge } from './utils/deep-merge.js';

/**
 *
 * @param {import('./types.js').TServerContext} context
 */
export async function webappMiddleware(context) {
  const { config, pluginManager, router } = context

  const plugins = pluginManager.getBrowserPlugins().plugins
  const pluginEntries = plugins.map(p => '/plugins/' + p.publicEntry)

  const sources = (config.sources || []).filter(source => source.downloadable && !source.offline)
    .map(source => {
      const indexName = path.basename(source.index).replace(/\.[^.]+$/, '')
      return {
        indexName,
        downloadable: true,
      }
  });

  const staticState = {
    title: config.webapp?.title || 'Home Gallery',
    pluginManager: {
      plugins: pluginEntries
    },
    sources,
  }

  const staticProperties = {
    basePath: browserBasePath(config.server.prefix || config.server.basePath),
    injectRemoteConsole: !!config.server.remoteConsoleToken,
  }

  /**
   * @param {import('express').Request & {webapp?: any, username?: string, user?: import('./auth/types.js').TUser}} req
   * @param {import('express').Response} _
   * @param {import('express').NextFunction} next
   */
  const middleware = async (req, _, next) => {
    const entries = await context.database.getFirstEntries(50, req)

    req.webapp = {
      ...staticProperties,
      state: {
        ...deepMerge(req.webapp?.state, req.user?.webapp),
        ...staticState,
        user: {
          username: req.user?.username || 'gallery',
          roles: req.user?.roles || [],
        },
        entries,
      }
    }

    next()
  }

  router.use(middleware)
}
