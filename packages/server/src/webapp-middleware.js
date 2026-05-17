import path from 'path';
import { browserBasePath } from './utils.js'
import { deepMerge } from './utils/deep-merge.js';

/**
 *
 * @param {import('./types.js').TServerContext} context
 */
export async function webappMiddleware(context) {
  const { config, pluginManager, router, auth } = context

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

  const { allowAnonymous } = auth
  const staticState = {
    ...config?.webapp,
    title: config.webapp?.title || 'Home Gallery',
    disabled: [
      ...(config.webapp?.disabled || []),
      ...(allowAnonymous ? [] : ['login'])
    ],
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

    const userWebapp = req.user?.webapp || {}
    const isUser = typeof req.username == 'string' && req.username != '$allow' && req.username != '$anonymou'

    req.webapp = {
      ...staticProperties,
      state: {
        ...staticState,
        disabled: deepMerge(staticState.disabled, userWebapp.disabled),
        pages: deepMerge(staticState.pages, userWebapp.pages),
        format: deepMerge(staticState.format, userWebapp.format),
        entries,
        ...(isUser ? {
          user: {
            username: req.username,
            roles: req.user?.roles || []
          }
        } : {}),
      }
    }

    next()
  }

  router.use(middleware)
}
