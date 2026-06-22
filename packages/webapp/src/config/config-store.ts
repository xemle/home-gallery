import { create } from 'zustand';
import { AppConfig } from './AppConfig';

interface ConfigStore {
  config: AppConfig
  updateConfig: (config: Partial<AppConfig>) => void
}

const defaultConfig: AppConfig = {
  title: 'Home Gallery',
  disabled: [],
  pluginManager: {
    plugins: []
  },
  entries: [],
}

const injectedConfig = window['__homeGallery'] || {};

const searchParams = new URLSearchParams(location.search?.substring(1) || '')
const urlDisabled = searchParams.getAll('disabled').filter(v => !!v)

const baseConfig = {
  ...defaultConfig,
  ...injectedConfig,
  disabled: [
    ...defaultConfig.disabled!,
    ...(injectedConfig.disabled || []),
    ...urlDisabled
  ],
  pluginManager: {
    ...defaultConfig.pluginManager,
    ...injectedConfig.pluginManager
  },
} as AppConfig

export const useConfigStore = create<ConfigStore>((set) => ({
  config: baseConfig,
  
  updateConfig(config) {
    set(prev => ({ 
      ...prev, 
      config: { 
        ...prev.config, 
        ...config,
        disabled: [
          ...(config.disabled || []),
          ...urlDisabled
        ]
      } 
    }))
  },
}))
