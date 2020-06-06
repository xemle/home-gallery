import * as React from "react";
import {
  BrowserRouter as Router,
  useParams,
  useLocation,
} from "react-router-dom";

import { useStoreState } from '../store/hooks';

import { MediaNav } from './MediaNav';
import { MediaViewUnknownType } from './MediaViewUnknownType';
import { MediaViewImage } from './MediaViewImage';
import { MediaViewVideo } from './MediaViewVideo';

function getMediaIndex(media, id) {
  for (let i = 0; i < media.length; i++) {
    if (media[i].id === id) {
      return i;
    }
  }
  return -1;
}

export const MediaView = () => {
  let { id } = useParams();
  let location = useLocation();

  const entries = useStoreState(state => state.entries.entries);
  let index = location.state && location.state.index ? location.state.index : getMediaIndex(entries, id);

  const media = entries[index];
  const prev = entries[index - 1];
  const next = entries[index + 1];

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
