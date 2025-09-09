import { useMemo } from "react";
import { type AppConfig } from "./AppConfig";

const defaultConfig: AppConfig = {
  metaTags: false,
  metaTagsPath: false,
  siteTitle: "My Gallery",
  HQzoom: false,
  disabled: [],
  pluginManager: {
    plugins: []
  },
  entries: [],
}

export const useAppConfig = () => {
  return useMemo(() => {
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

    return result as AppConfig
  }, [])
}
