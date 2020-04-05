import * as React from "react";
import {useState, useEffect} from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link
  } from "react-router-dom";
import { LastLocationProvider } from 'react-router-last-location';
import axios from 'axios';

import { StoreProvider } from 'easy-peasy';
import { useStoreActions, useStoreState } from './store/hooks';
import { store } from './store/store';

import { fetchAll } from './api';

import { List } from "./list/List";
import { MediaView } from './single/MediaView';
import { Years, YearView } from './year/Years';

export const Root = () => {
  return (
    <StoreProvider store={store}>
      <Main />
    </StoreProvider>
  )
}

export const Main = () => {
    const addEntries = useStoreActions(actions => actions.entries.addEntries);
    const basename = location.pathname.replace(/\/$/, '');
    console.log(`Set route basename to ${basename}`);
    useEffect(() => {
      const chunkLimits = [5000, 10000, 20000, 40000, 60000, 80000, 100000, 120000];
      fetchAll(chunkLimits, addEntries);
    }, []);
    
    return (
        <Router basename={basename}>
          <LastLocationProvider>
            <Switch>
                <Route exact path="/" children={<List />} />
                <Route exact path="/years" children={<Years />} />
                <Route exact path="/years/:year" children={<YearView />} />
                <Route path="/view/:id" children={<MediaView />} />
            </Switch>
          </LastLocationProvider>
        </Router>
    );
}
