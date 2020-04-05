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
    const load = useStoreActions(actions => actions.entries.load);
    const basename = location.pathname.replace(/\/$/, '');
    console.log(`Set route basename to ${basename}`);
    useEffect(() => {
        const chunkLimits = [5000, 10000, 20000, 40000, 60000, 80000, 100000, 120000];
        let chunkIndex = 0;

        const next = () => {
          let url = './api';
          let limit = 0;
          if (chunkIndex < chunkLimits.length) {
            const offset = chunkIndex > 0 ? chunkLimits[chunkIndex - 1] : 0;
            limit = chunkLimits[chunkIndex++] - offset;
            url += `?offset=${offset}&limit=${limit}`;
          } else if (chunkLimits.length) {
            const offset = chunkLimits[chunkLimits.length - 1];
            url += `?offset=${offset}`;
          }
          return axios.get(url)
            .then(res => {
              if (!res.data.media) {
                return;
              }
              load(res.data.media);
              if (limit && res.data.media.length == limit) {
                return next();
              }
            })
        }

        next();
      }, [])
    
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
