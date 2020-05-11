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

  let mediaTypeView = <MediaViewUnknownType media={media}/>;
  if (media.type === 'image' || media.type === 'rawImage') {
    mediaTypeView = <MediaViewImage key={media.id} media={media} next={next} prev={prev}/>
  } else if (media.type === 'video') {
    mediaTypeView = <MediaViewVideo key={media.id} media={media} next={next} prev={prev}/>
  }

  return (
    <>
      <div className="mediaView">
        <MediaNav />
        {mediaTypeView}
      </div>
    </>
  )
}
