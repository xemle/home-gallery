export const toPlugin = (mappers, name) => {
  return {
    name,
    version: '1.0.0',
    async initialize() {
      return {
        getDatabaseMappers() {
          return Array.isArray(mappers) ? mappers : [mappers]
        }
      }
    }
  }
} 