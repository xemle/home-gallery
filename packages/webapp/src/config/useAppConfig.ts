import type { WebAppFeatureFlags, AppConfig } from "./AppConfig";

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
  siteTitle: "Home Gallery",
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
  } as AppConfig

  const searchParams = new URLSearchParams(location.search?.substring(1) || '')

  result.disabled = [
    ...(defaultConfig.disabled || []),
    ...(webappConfig.disabled || []),
    ...searchParams.getAll('disabled').filter(v => !!v)
  ] as WebAppFeatureFlags

  return result as AppConfig
}
