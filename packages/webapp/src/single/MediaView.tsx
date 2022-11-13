import * as React from "react";
import { useState } from "react";
import {
  useParams,
  useLocation,
  useNavigate
} from "react-router-dom";
import Hammer from 'hammerjs';
import { useHotkeys } from 'react-hotkeys-hook';

import { useEntryStore } from "../store/entry-store";
import { useSearchStore } from "../store/search-store";
import { useSingleViewStore } from "../store/single-view-store";
import useListLocation from '../utils/useListLocation';

import { MediaNav } from './MediaNav';
import { MediaViewUnknownType } from './MediaViewUnknownType';
import { MediaViewImage } from './MediaViewImage';
import { MediaViewVideo } from './MediaViewVideo';
import { Details } from './Details';
import { Zoomable } from "./Zoomable";
import useBodyDimensions from "../utils/useBodyDimensions";

const findEntryIndex = (location, entries, id) => {
  if (location.state?.index && entries[location.state.index]?.id.startsWith(id)) {
    return location.state.index;
  }
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].id.startsWith(id)) {
      return i;
    }
  }
  return -1;
}

const scaleDimensions = (media, device) => {
  if (!media) {
    return { width: device.width, height: device.height }
  }
  const mediaRatio = media.height / (media.width || 1);
  const deviceRatio = device.height / (device.width || 1);
  if (deviceRatio < mediaRatio) {
    return { width: device.height / mediaRatio, height: device.height }
  } else {
    return { width: device.width, height: device.width * mediaRatio }
  }
}

const encodeUrl = (url: string) => url.replace(/[\/]/g, char => encodeURIComponent(char))

const hotkeysToAction = {
  'home': 'first',
  'left,j,backspace': 'prev',
  'ctrl+left': 'prev-10',
  'ctrl+shift+left': 'prev-100',
  'right,k,space': 'next',
  'ctrl+right': 'next-10',
  'ctrl+shift+right': 'next-100',
  'end': 'last',
  'esc': 'list',
  'i': 'toggleDetails',
  's': 'similar',
  'c': 'chronology',
  't': 'toggleNavigation',
  'm': 'map'
}

export const MediaView = () => {
  let { id } = useParams();
  let location = useLocation();
  const navigate = useNavigate();
  const listLocation = useListLocation();
  const dimensions = useBodyDimensions();

  const entries = useEntryStore(state => state.entries);
  const showDetails = useSingleViewStore(state => state.showDetails);
  const showNavigation = useSingleViewStore(state => state.showNavigation);
  const search = useSearchStore(state => state.search);
  const setShowDetails = useSingleViewStore(actions => actions.setShowDetails);
  const setShowNavigation = useSingleViewStore(actions => actions.setShowNavigation);

  const [hideNavigation, setHideNavigation] = useState(false)

  let index = findEntryIndex(location, entries, id);

  const current = entries[index];
  const prev = entries[index - 1];
  const next = entries[index + 1];

  const isImage = current && (current.type === 'image' || current.type === 'rawImage');
  const isVideo = current && (current.type === 'video')
  const isUnknown = !current || (['image', 'rawImage', 'video'].indexOf(current.type) < 0)

  const key = current ? current.id : (Math.random() * 100000).toFixed(0);
  const scaleSize = scaleDimensions(current, dimensions);
  console.log(scaleSize, dimensions, current);

  const viewEntry = (index) => {
    const { shortId } = entries[index]
    navigate(`/view/${shortId}`, {state: {index, listLocation}});
  }

  const dispatch = (action) => {
    const { type } = action
    let prevNextMatch = type.match(/(prev|next)(-(\d+))?/)
    if (prevNextMatch && entries.length) {
      const offset = prevNextMatch[3] ? +prevNextMatch[3] : 1
      const negate = prevNextMatch[1] == 'prev' ? -1 : 1
      const i = Math.min(entries.length - 1, Math.max(0, index + (negate * offset)))
      viewEntry(i)
    } else if (type === 'similar' && current?.similarityHash) {
      navigate(`/similar/${current.shortId}`);
    } else if (type === 'toggleDetails') {
      setShowDetails(!showDetails);
    } else if (type === 'toggleNavigation') {
      setShowNavigation(!showNavigation);
    } else if (type == 'first' && entries.length) {
      viewEntry(0)
    } else if (type == 'last' && entries.length) {
      viewEntry(entries.length - 1)
    } else if (type == 'list') {
      navigate(`${listLocation.pathname}${listLocation.search ? encodeUrl(listLocation.search) : ''}`, {state: {id: current.id}});
    } else if (type == 'chronology') {
      search({type: 'none'});
      navigate('/');
    } else if (type == 'play') {
      setHideNavigation(true);
    } else if (type == 'pause') {
      setHideNavigation(false);
    } else if (type == 'search') {
      navigate(`/search/${encodeUrl(action.query)}`);
    } else if (type == 'map') {
      navigate(`/map?lat=${current.latitude.toFixed(5)}&lng=${current.longitude.toFixed(5)}&zoom=14`, {state: {listLocation}})
    }
  }

  const onSwipe = (ev) => {
    if (ev.direction === Hammer.DIRECTION_LEFT) {
      dispatch({type: 'next'})
    } else if (ev.direction === Hammer.DIRECTION_RIGHT) {
      dispatch({type: 'prev'})
    }
  }

  useHotkeys(Object.keys(hotkeysToAction).join(','), (ev, handler) => {
    const found = Object.keys(hotkeysToAction).find(hotkey => {
      const keys = hotkey.split(',')
      const found = keys.find(key => handler.key == key)
      if (found) {
        console.log(`Catch hotkey ${found} for ${hotkeysToAction[hotkey]}`)
        dispatch({type: hotkeysToAction[hotkey]})
        return true
      }
    })
    if (found) {
      ev.preventDefault()
    }
  }, [index, showDetails, showNavigation])

  console.log('Media object', current, showDetails);

  return (
    <>
      <div className={`single ${showDetails ? '-withDetail' : ''}`}>
        <div className="single__media position-fixed-md">
          <div className="MediaViewContainer">
            {!hideNavigation &&
              <MediaNav index={index} current={current} prev={prev} next={next} listLocation={listLocation} showNavigation={showNavigation} dispatch={dispatch} />
            }
            {isImage &&
              <Zoomable key={key} childWidth={scaleSize.width} childHeight={scaleSize.height} onSwipe={onSwipe}>
                <MediaViewImage key={key} media={current} next={next} prev={prev} showDetails={showDetails}/>
              </Zoomable>
            }
            {isVideo &&
              <MediaViewVideo key={key} media={current} next={next} prev={prev} dispatch={dispatch}/>
            }
            {isUnknown &&
              <MediaViewUnknownType key={key} media={current} next={next} prev={prev}/>
            }
          </div>
        </div>
        { showDetails &&
          <div className="single__detail">
            <Details entry={current} dispatch={dispatch} />
          </div>
        }
      </div>
    </>
  )
}

