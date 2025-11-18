
import path from 'path';
import { browserBasePath } from './utils.js'

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
    ...config?.webapp,
    title: config.webapp?.title || 'Home Gallery',
    disabled: config.webapp?.disabled || [],
    pluginManager: {
      plugins: pluginEntries
    },
    sources,
  }

  const staticProperties = {
    basePath: browserBasePath(config.server.prefix || config.server.basePath),
    injectRemoteConsole: !!config.server.remoteConsoleToken,
  }

  router.use(async (req, _, next) => {
    if (!req.webapp) {
      req.webapp = {}
    }
    const entries = await context.database.getFirstEntries(50, req)

    req.webapp = {
      ...req.webapp,
      ...staticProperties,
      state: {
        ...req.webapp.state,
        ...staticState,
        disabled: !!req.username ? [...staticState.disabled, 'pwa'] : staticState.disabled,
        entries,
      }
    }

    next()
  })
}