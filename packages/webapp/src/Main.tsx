import * as React from "react";
import {useEffect} from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route,
  } from "react-router-dom";
import { LastLocationProvider } from 'react-router-last-location';

import { StoreProvider } from 'easy-peasy';
import { useStoreActions } from './store/hooks';
import { store } from './store/store';

import { baseResolver } from './base-resolver';
import { fetchAll, getEvents, eventStream } from './api';

import { AllView } from "./list/All";
import { SearchView } from './list/Search';
import { SimilarView } from './list/Similar';
import { Years, YearView } from './year/Years';
import { MediaView } from './single/MediaView';

export const Root = () => {
  return (
    <StoreProvider store={store}>
      <Main />
    </StoreProvider>
  )
}

export const Main = () => {
    const addEntries = useStoreActions(actions => actions.entries.addEntries);
    const initEvents = useStoreActions(actions => actions.events.initEvents);
    const addEvent = useStoreActions(actions => actions.events.addEvent);
    const basename = '/';

    useEffect(() => {
      const chunkLimits = [5000, 10000, 20000, 40000, 60000, 80000, 100000, 120000];
      fetchAll(chunkLimits, addEntries)
        .then(() => getEvents())
        .then((events) => {
          initEvents(events.data);
          eventStream((event) => {
            addEvent(event);
          });
        });
    }, []);

    return (
        <Router basename={`${baseResolver()}/`}>
          <LastLocationProvider>
            <Switch>
                <Route exact path="/" children={<AllView />} />
                <Route exact path="/years" children={<Years />} />
                <Route exact path="/years/:year" children={<YearView />} />
                <Route path="/view/:id" children={<MediaView />} />
                <Route path="/similar/:id" children={<SimilarView />} />
                <Route path="/search/:term" children={<SearchView />} />
            </Switch>
          </LastLocationProvider>
        </Router>
    );
}
