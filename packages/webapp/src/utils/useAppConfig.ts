const defaultConfig = {
   /**
   * List of disabled features
   *
   * - edit: No edit menu button
   * - serverEvents: No subscription to server sent events (SSE)
   * - offlineDatabase: No offline database via IndexedDB
   *
   * A feature will be expanded to `disabledEdit: true`
   */
  metaTags: false,
  metaTagsPath: false,
  siteTitle: "My Gallery",
  HQzoom: false,
  disabled: [],
  removed: [],
  pluginManager: {
    plugins: []
  },
  entries: [],
}

export const useAppConfig = () => {
  const injectedConfig = window['__homeGallery'] || {};
  const webappConfig = injectedConfig.webapp || {};

  const pluginManager = {
    ...defaultConfig.pluginManager,
    ...injectedConfig.pluginManager
  }

  const result = {
    ...defaultConfig,
    ...injectedConfig,
    ...webappConfig,
    pluginManager
  }

  const searchParams = new URLSearchParams(location.search?.substring(1) || '')

  result.disabled = [
    ...(defaultConfig.disabled || []),
    ...(injectedConfig.disabled || []),
    ...(webappConfig.disabled || []),
    ...searchParams.getAll('disabled').filter(v => !!v)
  ]

  result.removed = [
    ...(defaultConfig.removed || []),
    ...(injectedConfig.removed || []),
    ...(webappConfig.removed || []),
    ...searchParams.getAll('removed').filter(v => !!v)
  ]

  result.disabled.forEach((feature: string) => {
    result[`disabled${feature[0].toUpperCase()}${feature.slice(1)}`] = true
  })

	result.removed.forEach((feature: string) => {
	  const name = `removed${feature[0].toUpperCase()}${feature.slice(1)}`
	  result[name] = true
	})
  return result
}
