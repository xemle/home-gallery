import * as React from "react";
import {
  BrowserRouter,
} from "react-router-dom";
import { LastLocationProvider } from './utils/lastLocation/LastLocationProvider'
import { AppRoutes } from "./AppRoutes";
import { AppContextProvider } from "./AppContext";
import LoadDatabaseAndEvents from "./init/LoadDatabaseAndEvents";

export const Main = () => {
  const base = document.querySelector('base')?.getAttribute('href') || '/';

  return (
    <BrowserRouter basename={base}>
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
