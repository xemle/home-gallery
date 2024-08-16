import React, { createContext, useContext, useState, useEffect } from "react"
import AppLoading from "./init/AppLoading"

type TAppContext = {
}

type TAppLoadingState = {
  isLoading: boolean
  hasError: boolean
  appContext: TAppContext
}

const AppContext = createContext<TAppContext>({} as TAppContext)

export const AppContextProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [state, setState] = useState<TAppLoadingState>({isLoading: true, hasError: false, appContext: {} as TAppContext})

  useEffect(() => {
    setState(state => ({...state, isLoading: false}))
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
