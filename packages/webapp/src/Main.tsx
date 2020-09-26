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

import { fetchAll, getEvents, eventStream } from './api/ApiService';

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

    useEffect(() => {
      const fetchEvents = () => getEvents()
        .then(events => initEvents(events.data))
        .catch(e => {
          console.log(`Could not fetch intitial events: ${e}`);
        })

      const subscribeEvents = () => eventStream((event) => addEvent(event));

      const chunkLimits = [5000, 10000, 20000, 40000, 60000, 80000, 100000, 120000];
      fetchAll(chunkLimits, addEntries)
        .then(fetchEvents)
        .then(subscribeEvents);
    }, []);

    const base = document.querySelector('base')?.getAttribute('href') || '/';

    return (
        <Router basename={base}>
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
