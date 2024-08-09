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
    async initialize(manager) {
      /** @type {import('@home-gallery/types').TModuleFactory} */
      const factory = {
        getExtractors: () => Array.isArray(extractorFactory) ? extractorFactory.map(factory => factory(manager)) : [extractorFactory(manager)]
      }
      return factory
    }
  }

  return plugin
}