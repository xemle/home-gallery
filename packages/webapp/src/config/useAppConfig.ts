import { AppConfig } from "./AppConfig";

const defaultConfig: AppConfig = {
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
  pluginManager: {
    plugins: []
  },
  entries: [],
}

export const useAppConfig = () => {
  const injectedConfig = window['__homeGallery'] || {};

  const pluginManager = {
    ...defaultConfig.pluginManager,
    ...injectedConfig.pluginManager
  }

  const result = {
    ...defaultConfig,
    ...injectedConfig,
    pluginManager
  }

  const searchParams = new URLSearchParams(location.search?.substring(1) || '')
  result.disabled.push(...searchParams.getAll('disabled').filter(v => !!v))

  result.disabled.forEach((feature: string) => {
    const name = `disabled${feature[0].toUpperCase()}${feature.slice(1)}`
    result[name] = true
  })

  return result as AppConfig
}

