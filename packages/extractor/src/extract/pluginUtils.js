/**
 * @callback ExtractorFactory
 * @param {import('@home-gallery/types').TPluginManager} manager
 * @return {import('@home-gallery/types').TExtractor}}
 */
/**
 * @param {ExtractorFactory | ExtractorFactory[]} extractorFactory
 * @param {string[]} [requires]
 * @returns {import('@home-gallery/types').TPlugin}
 */
export const toPlugin = (extractorFactory, name, requires = []) => {
  /** @type {import('@home-gallery/types').TPlugin} */
  const plugin = {
    name,
    version: '1.0.0',
    requires,
    /** @param {import('@home-gallery/types').TPluginManager} manager */
    async initialize(manager) {
      if (Array.isArray(extractorFactory)) {
        for (let factory of extractorFactory) {
          await manager.register('extractor', factory(manager))
        }
      } else {
        await manager.register('extractor', extractorFactory(manager))
      }
    }
  }

  return plugin
}