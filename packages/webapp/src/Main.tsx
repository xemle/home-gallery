import {
  BrowserRouter,
} from "react-router-dom";

import Logger from '@home-gallery/logger';

import { AppContextProvider } from "./AppContext";
import { AppRoutes } from "./AppRoutes";
import LoadDatabaseAndEvents from "./init/LoadDatabaseAndEvents";
import { LastLocationProvider } from './utils/lastLocation/LastLocationProvider';


export const Main = () => {
  const base = document.querySelector('base')?.getAttribute('href') || '/';
  // Browser router should serve base path /pictures/ by url path /pictures
  const basename = base.match(/[^/]\/$/) ? base.substring(0, base.length - 1) : base

  Logger.setLevel('trace')

  return (
    <BrowserRouter basename={basename}>
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
