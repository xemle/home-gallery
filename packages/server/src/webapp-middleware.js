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
    allowPublic: config.server?.auth?.public?.allow || false,
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

    const currentUser = req.username ? {
      username: req.username,
      readOnly: req.readOnly || false,
    } : null

    const userPagesDisabled = req.pages?.disabled || []
    const staticPagesDisabled = staticState.pages?.disabled || []
    const mergedPagesDisabled = [...new Set([...staticPagesDisabled, ...userPagesDisabled])]
    const mergedPages = mergedPagesDisabled.length
      ? { ...staticState.pages, disabled: mergedPagesDisabled }
      : staticState.pages

    req.webapp = {
      ...req.webapp,
      ...staticProperties,
      state: {
        ...req.webapp.state,
        ...staticState,
        disabled: !!req.username ? [...staticState.disabled, 'pwa'] : staticState.disabled,
        pages: mergedPages,
        entries,
        currentUser,
        readOnly: req.readOnly || false,
      }
    }

    next()
  })
}
