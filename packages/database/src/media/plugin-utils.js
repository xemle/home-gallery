export const toPlugin = (mappers, name) => {
  return {
    name,
    version: '1.0.0',
    /** @param {import('@home-gallery/types').TPluginManager} manager */
    async initialize(manager) {
      for (let mapper of mappers) {
        await manager.register('database', mapper)
      }
    }
  }
} 