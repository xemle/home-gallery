import * as React from "react";
import { useMemo, useState, useEffect, useRef } from "react";
import {
  useParams,
  useLocation,
  useHistory
} from "react-router-dom";
import Hammer from 'hammerjs';

import { useStoreState, useStoreActions } from '../store/hooks';
import { SingleViewMode } from '../store/single-view';
import useListLocation from './useListLocation';

import { MediaNav } from './MediaNav';
import { MediaViewUnknownType } from './MediaViewUnknownType';
import { MediaViewImage } from './MediaViewImage';
import { MediaViewVideo } from './MediaViewVideo';
import { Details } from './Details';
import { Zoomable } from "./Zoomable";
import useBodyDimensions from "../utils/useBodyDimensions";

const findEntryIndex = (location, entries, id) => {
  if (location.state?.index && entries[location.state.index]?.id === id) {
    return location.state.index;
  }
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].id === id) {
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

export const MediaView = () => {
  let { id } = useParams();
  let location = useLocation();
  const history = useHistory();
  const listLocation = useListLocation();
  const dimensions = useBodyDimensions();

  const entries = useStoreState(state => state.entries.entries);
  const viewMode = useStoreState(state => state.singleViewModel.viewMode);
  const search = useStoreActions(actions => actions.search.search);
  const setViewMode = useStoreActions(actions => actions.singleViewModel.setViewMode);

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

  const onNavClick = ({type}) => {
    if (type === 'similar' && current.similarityHash) {
      history.push(`/similar/${current.id}`);
    } else if (type === 'info') {
      setViewMode(viewMode === SingleViewMode.VIEW ? SingleViewMode.DETAIL : SingleViewMode.VIEW);
    } else {
      search({type: 'none'});
      history.push('/');
    }
  }

  const onSwipe = (ev) => {
    if (ev.direction === Hammer.DIRECTION_LEFT && next) {
      history.push(`/view/${next.id}`, {listPathname: location.pathname, index: index + 1});
    } else if (ev.direction === Hammer.DIRECTION_RIGHT && prev) {
      history.push(`/view/${prev.id}`, {listPathname: location.pathname, index: index - 1});
    }
  }

  const showDetails = useMemo(() => viewMode === SingleViewMode.DETAIL, [viewMode])

  console.log('Media object', current, viewMode);

  return (
    <>
      <div className={`single ${showDetails ? '-withDetail' : ''}`}>
        <div className="single__media position-fixed-md">
          <div className="MediaViewContainer">
            <MediaNav index={index} current={current} prev={prev} next={next} listLocation={listLocation} onClick={onNavClick} />
            {isImage &&
              <Zoomable key={key} childWidth={scaleSize.width} childHeight={scaleSize.height} onSwipe={onSwipe}>
                <MediaViewImage key={key} media={current} next={next} prev={prev} showDetails={showDetails}/>
              </Zoomable>
            }
            {isVideo &&
              <MediaViewVideo key={key} media={current} next={next} prev={prev}/>
            }
            {isUnknown &&
              <MediaViewUnknownType key={key} media={current} next={next} prev={prev}/>
            }
          </div>
        </div>
        { showDetails &&
          <div className="single__detail">
            <Details current={current} />
          </div>
        }
      </div>
    </>
  )
}

