const defaultConfig = {
  entries: [],
  /**
   * List of disabled features
   *
   * - edit: No edit menu button
   * - serverEvents: No subscription to server sent events (SSE)
   * - offlineDatabase: No offline database via IndexedDB
   *
   * A feature will be expanded to `disabledEdit: true`
   */
  disabled: [],
}

export const useAppConfig = () => {
  const injectedConfig = window['__homeGallery'] || {};
  const result = {...defaultConfig, ...injectedConfig}

  const searchParams = new URLSearchParams(location.search?.substring(1) || '')
  result.disabled.push(...searchParams.getAll('disabled').filter(v => !!v))

  result.disabled.forEach((feature: string) => {
    const name = `disabled${feature[0].toUpperCase()}${feature.slice(1)}`
    result[name] = true
  })

  return result
}

