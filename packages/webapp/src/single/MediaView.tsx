import * as React from "react";
import {
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
  const listPathname = useListPathname();
  const dimensions = useBodyDimensions();

  const entries = useStoreState(state => state.entries.entries);
  const search = useStoreActions(actions => actions.search.search);

  let index = findEntryIndex(location, entries, id);

  const current = entries[index];
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

  const isImage = current && (current.type === 'image' || current.type === 'rawImage');
  const isVideo = current && (current.type === 'video')
  const isUnknown = !current || (['image', 'rawImage', 'video'].indexOf(current.type) < 0)

  const key = current ? current.id : (Math.random() * 100000).toFixed(0);
  const scaleSize = scaleDimensions(current, dimensions);
  console.log(scaleSize, dimensions, current);

  const onNavClick = ({type}) => {
    if (type === 'similar' && current.similarityHash) {
      history.push(`/similar/${current.id}`);
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

  return (
    <>
      <MediaNav index={index} current={current} prev={prev} next={next} listPathname={listPathname} onClick={onNavClick} />
      {isImage &&
        <Zoomable key={key} width={scaleSize.width} height={scaleSize.height} onSwipe={onSwipe}>
          <MediaViewImage key={key} media={current} next={next} prev={prev}/>
        </Zoomable>
      }
      {isVideo &&
        <MediaViewVideo key={key} media={current} next={next} prev={prev}/>
      }
      {isUnknown &&
        <MediaViewUnknownType key={key} media={current} next={next} prev={prev}/>
      }
    </>
  )
}

