import * as React from "react";
import { useRef, useLayoutEffect } from "react";
import {
  BrowserRouter as Router,
  useParams,
  useLocation,
  useHistory
} from "react-router-dom";
import Hammer from 'hammerjs';

import { useStoreState } from '../store/hooks';
import useListPathname from './useListPathname';

import { MediaNav } from './MediaNav';
import { MediaViewUnknownType } from './MediaViewUnknownType';
import { MediaViewImage } from './MediaViewImage';
import { MediaViewVideo } from './MediaViewVideo';

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

export const MediaView = () => {
  let { id } = useParams();
  let location = useLocation();
  const history = useHistory();
  const listPathname = useListPathname();

  const entries = useStoreState(state => state.entries.entries);
  let index = findEntryIndex(location, entries, id);

  const media = entries[index];
  const prev = entries[index - 1];
  const next = entries[index + 1];

  const ref = useRef();
  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }
    const element = ref.current;
    const mc = new Hammer.Manager(element, {
      recognizers: [
        [Hammer.Pan,{ direction: Hammer.DIRECTION_ALL }]
      ]
    });

    mc.on('panright', () => prev && history.push(`/view/${prev.id}`, { listPathname, index: index - 1 }));
    mc.on('panleft', () => next && history.push(`/view/${next.id}`, { listPathname, index: index + 1 }));
    mc.on('panup', () => history.push(listPathname));

    return () => {
      if (!mc) {
        return;
      }
      mc.stop(false);
      mc.destroy();
    }
  });

  const isImage = media.type === 'image' || media.type === 'rawImage'
  const isVideo = media.type === 'video'
  const isUnknown = !media || (['image', 'rawImage', 'video'].indexOf(media.type) < 0)

  return (
    <>
      <MediaNav index={index} prev={prev} next={next} listPathname={listPathname} />
      <div className="mediaView" ref={ref}>
        {isImage &&
          <MediaViewImage key={media.id} media={media} next={next} prev={prev}/>
        }
        {isVideo &&
          <MediaViewVideo key={media.id} media={media} next={next} prev={prev}/>
        }
        {isUnknown &&
          <MediaViewUnknownType key={media.id} media={media} next={next} prev={prev}/>
        }
      </div>
    </>
  )
}

