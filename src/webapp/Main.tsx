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

import { Grid } from "./components/Grid";
import { MediaView } from './components/MediaView';
import { Years, YearView } from './components/Years';

export const Root = () => {
  return (
    <StoreProvider store={store}>
      <Main />
    </StoreProvider>
  )
}

export const Main = () => {
    const [ media, setMedia ] = useState([]);
    const entries = useStoreState(state => state.entries.entries);
    const load = useStoreActions(actions => actions.entries.load);
    useEffect(() => {
        axios.get(`/api`)
        .then(res => {
          const map = res.data.media.reduce((result, value) => {
            if (!result[value.id]) {
              result[value.id] = value;
            }
            return result;
          }, Object.create({}));
          const entries = Object.values(map);
      
          entries.sort((a: {date: string}, b: {date:string}) => a.date < b.date ? 1 : -1);
          setMedia(entries);
          load(entries);
        })
    
      }, [])
    
    return (
        <Router>
          {entries.length}
          <LastLocationProvider>
            <Switch>
                <Route exact path="/" children={<Grid media={media}/>} />
                <Route exact path="/images" children={<Grid media={media.filter(m => m.type === 'image' || m.type === 'rawImage')}/>} />
                <Route exact path="/videos" children={<Grid media={media.filter(m => m.type === 'video')}/>} />
                <Route exact path="/years" children={<Years media={media}/>} />
                <Route exact path="/years/:year" children={<YearView media={media}/>} />
                <Route path="/view/:id" children={<MediaView media={media}/>} />
            </Switch>
          </LastLocationProvider>
        </Router>
    );
}
