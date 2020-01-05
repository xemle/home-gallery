import * as React from "react";
import {useState, useEffect} from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link
  } from "react-router-dom";
import axios from 'axios';

import { Grid } from "./components/Grid";
import { MediaView } from './components/MediaView';

export const Main = (props) => {
    const [ media, setMedia ] = useState([]);

    useEffect(() => {
        const t0 = Date.now();
        axios.get(`/api`)
        .then(res => {
          const t1 = Date.now();
          const map = res.data.media.reduce((result, value) => {
              if (!result[value.id]) {
                result[value.id] = value;
              }
            return result;
          }, Object.create({}));
          const ids = Object.keys(map);
          const media = Object.values(map);
            const t2 = Date.now();
      
          media.sort((a: {date: string}, b: {date:string}) => a.date < b.date ? 1 : -1);
          const t3 = Date.now();
          console.log(`Load took ${t3 - t0} ms, request took ${t1 - t0}ms, filtering took ${t2 - t1} ms, sorting took ${t3 - t2}ms`);
          setMedia(media);
        })
    
      }, [])
    
    return (
        <Router>
            <Switch>
                <Route exact path="/" children={<Grid media={media}/>} />
                <Route exact path="/images" children={<Grid media={media.filter(m => m.type === 'image' || m.type === 'rawImage')}/>} />
                <Route exact path="/videos" children={<Grid media={media.filter(m => m.type === 'video')}/>} />
                <Route path="/view/:id" children={<MediaView media={media}/>} />
            </Switch>
        </Router>
    );
}
