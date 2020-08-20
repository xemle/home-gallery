import * as React from "react";
import { useRef, useLayoutEffect } from "react";
import {
  BrowserRouter as Router,
  useParams,
  useLocation,
  useHistory
} from "react-router-dom";
import Hammer from 'hammerjs';

import { useStoreState, useStoreActions } from '../store/hooks';
import useListPathname from './useListPathname';

import { MediaNav } from './MediaNav';
import { MediaViewUnknownType } from './MediaViewUnknownType';
import { MediaViewImage } from './MediaViewImage';
import { MediaViewVideo } from './MediaViewVideo';
import { Zoomable } from "./Zoomable";
import useBodyDimensions from "../utils/useBodyDimensions";

const findEntryIndex = (location, entries, id) => {
  if (location.state && location.state.index) {
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
  const listPathname = useListPathname();
  const dimensions = useBodyDimensions();

  const entries = useStoreState(state => state.entries.entries);
  const search = useStoreActions(actions => actions.search.search);

  let index = findEntryIndex(location, entries, id);

  const media = entries[index];
  const prev = entries[index - 1];
  const next = entries[index + 1];

  /*
  const ref = useRef();
  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }
    const element = ref.current;
    const mc = new Hammer.Manager(element, {
      recognizers: [
        [Hammer.Swipe,{ direction: Hammer.DIRECTION_ALL }]
      ]
    });

    mc.on('swiperight', () => prev && history.push(`/view/${prev.id}`, { listPathname, index: index - 1 }));
    mc.on('swipeleft', () => next && history.push(`/view/${next.id}`, { listPathname, index: index + 1 }));
    mc.on('swipeup', () => history.push(listPathname));

    return () => {
      if (!mc) {
        return;
      }
      mc.stop(false);
      mc.destroy();
    }
  });
  */

  const isImage = media && (media.type === 'image' || media.type === 'rawImage');
  const isVideo = media && (media.type === 'video')
  const isUnknown = !media || (['image', 'rawImage', 'video'].indexOf(media.type) < 0)

  const key = media ? media.id : (Math.random() * 100000).toFixed(0);
  const scaleSize = scaleDimensions(media, dimensions);
  console.log(scaleSize, dimensions, media);

  const onNavClick = ({type}) => {
    if (type === 'similar' && media.similarityHash) {
      search({type: 'similar', value: media.similarityHash});
    } else {
      search({type: 'none'});
    }
    history.push('/');
  }

  return (
    <>
      <MediaNav index={index} current={media} prev={prev} next={next} listPathname={listPathname} onClick={onNavClick} />
      {isImage &&
        <Zoomable key={key} width={scaleSize.width} height={scaleSize.height}>
          <MediaViewImage key={key} media={media} next={next} prev={prev}/>
        </Zoomable>
      }
      {isVideo &&
        <MediaViewVideo key={key} media={media} next={next} prev={prev}/>
      }
      {isUnknown &&
        <MediaViewUnknownType key={key} media={media} next={next} prev={prev}/>
      }
    </>
  )
}

