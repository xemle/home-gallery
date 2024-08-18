/** 
 * @param {import('@home-gallery/types').TPluginManager} manager 
 * @return {import('@home-gallery/types').TQueryPlugin} 
 */
const textCacheQueryPlugin = manager => {
  const log = manager.createLogger('server.api.database.textCache')
  const context = manager.getContext()
  const { eventbus } = context

  let cache = new WeakMap()

  eventbus?.on('server', event => {
    if (event?.action == 'databaseReloaded') {
      cache = new WeakMap()
      log.trace('Clear query text cache')
    }
  })

  eventbus?.on('database', (event) => {
    if (event?.action == 'updateEntries') {
      const entries = event?.entries || []
      const cachedEntries = entries.filter(entry => cache.has(entry))
      if (!cachedEntries.length) {
        return
      }
      cachedEntries.forEach(entry => cache.delete(entry))
      log.trace(`Cleared query text cache for ${cachedEntries.length} entries`)
    }
  })  

  const cacheTextFn = textFn => {
    return entry => {
      if (!cache.has(entry)) {
        cache.set(entry, textFn(entry))
      }
      return cache.get(entry)
    }
  }

  return {
    name: 'textCacheQueryPlugin',
    order: 100,
    transformRules: [
      {
        transform(ast, context) {
          if (ast.type == 'query') {
            const origTextFn = context.textFn
            context.textFn = cacheTextFn(origTextFn)
          }
        }
      }
    ]
  }
}

/** @type {import('@home-gallery/types').TPlugin} */
const queryTextCache = {
  name: 'queryTextCache',
  version: '1.0.0',
  /** @param {import('@home-gallery/types').TPluginManager} manager */
  async initialize(manager) {
    const log = manager.createLogger('server.api.database.textCache')

    const context = manager.getContext()
    if (context.type == 'serverContext' || context.type == 'cliContext') {
      await manager.register('query', textCacheQueryPlugin(manager))
      log.debug(`Use text cache for queries`)
    } else {
      log.debug(`Skip query text cache for non server contexts`)
    }
  }
}

export default queryTextCache