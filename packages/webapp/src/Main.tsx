import * as React from "react";
import { useEffect } from "react";
import {
  BrowserRouter,
} from "react-router-dom";

import Logger from '@home-gallery/logger'

import { LastLocationProvider } from './utils/lastLocation/LastLocationProvider'
import { AppRoutes } from "./AppRoutes";
import { AppContextProvider } from "./AppContext";
import LoadDatabaseAndEvents from "./init/LoadDatabaseAndEvents";
import { useAuthStore } from "./store/auth-store";


const AuthInit = () => {
  const init = useAuthStore(state => state.init)

  useEffect(() => {
    const injected = window['__homeGallery'] || {}
    init(injected.authType || 'basic', injected.currentUser || null)
  }, [])

  return null
}

export const Main = () => {
  const base = document.querySelector('base')?.getAttribute('href') || '/';
  // Browser router should serve base path /pictures/ by url path /pictures
  const basename = base.match(/[^/]\/$/) ? base.substring(0, base.length - 1) : base

  Logger.setLevel('trace')

  return (
    <BrowserRouter basename={basename}>
      <AuthInit />
      <LastLocationProvider>
        <AppContextProvider>
          <LoadDatabaseAndEvents>
            <AppRoutes />
          </LoadDatabaseAndEvents>
        </AppContextProvider>
      </LastLocationProvider>
    </BrowserRouter>
  );
}
