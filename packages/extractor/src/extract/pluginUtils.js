/**
 * @param {import('@home-gallery/types').TExtractorPlugin | import('@home-gallery/types').TExtractorPlugin[]} extractor
 * @param {string[]} [requires]
 * @returns {import('@home-gallery/types').TPlugin}
 */
export const toPlugin = (extractor, name, requires = []) => {
  /**
   * @type {import('@home-gallery/types').TPlugin}
   */
  const plugin = {
    name,
    version: '1.0.0',
    requires,
    async initialize() {
      /**
       * @type {import('@home-gallery/types').TModuleFactory}
       */
      const factory = {
        getExtractors: () => Array.isArray(extractor) ? extractor : [extractor]
      }
      return factory
    }
  }

  return plugin
}