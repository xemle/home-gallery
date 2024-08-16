import React, { createContext, useContext, useState, useEffect, useMemo } from "react"
import { BrowserPluginManager } from "./plugin/browserPluginManager"
import AppLoading from "./init/AppLoading"
import { useAppConfig } from "./utils/useAppConfig"
import { TGalleryConfig, TGalleryContext } from "@home-gallery/types"
import Logger from '@home-gallery/logger'

type TAppContext = {
  pluginManager: BrowserPluginManager
}

type TAppLoadingState = {
  isLoading: boolean
  hasError: boolean
  appContext: TAppContext
}

const AppContext = createContext<TAppContext>({} as TAppContext)

export const AppContextProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [state, setState] = useState<TAppLoadingState>({isLoading: true, hasError: false, appContext: {} as TAppContext})
  const config = useAppConfig()

  useEffect(() => {
    const context: TGalleryContext = {
      type: 'browserContext',
      plugin: {

      }
    }

    const loadManager = async () => {
      const log = Logger('AppContext')
      const pluginManager = new BrowserPluginManager(config as TGalleryConfig, context)

      pluginManager.loadPlugins()
        .then((() => {
          setState(prev => {
            const extensions = pluginManager.getExtensions()
            log.info(`All plugins with ${extensions.length} extensions are loaded`)
            return {
              ...prev,
              isLoading: false,
              appContext: {
                pluginManager
              }
            }
          })
        }))
        .catch(err => {
          log.error(err, `Failed to load plugins: ${err}`)
          setState(prev => ({...prev, isLoading: false, hasError: true}))
        })
    }

    loadManager()
  }, [])

  if (state.isLoading || state.hasError) {
    return (
      <AppLoading state={state} />
    )
  }

  return (
    <AppContext.Provider value={state.appContext}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => {
  const context = useContext(AppContext);

  return context;
}

export const usePluginManager = () => {
  const { pluginManager } = useContext(AppContext);

  return pluginManager;
}

export const useLogger = (module: string) => {
  const { pluginManager } = useContext(AppContext);

  const log = useMemo(() => pluginManager.createLogger(module), [module, pluginManager])
  return log;
}
