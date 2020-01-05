import * as React from "react";
import {
  BrowserRouter as Router,
  useParams
} from "react-router-dom";
import { MediaViewUnknownType } from './MediaViewUnknownType';
import { MediaViewImage } from './MediaViewImage';
import { MediaViewVideo } from './MediaViewVideo';

export const MediaView = (props) => {
  let { id } = useParams();
  const media = props.media.filter(m => m.id === id).pop() || {};
  const { previews, type } = media;
  
  let mediaTypeView = <MediaViewUnknownType media={media} />;
  if (type === 'image' || type === 'rawImage') {
    mediaTypeView = <MediaViewImage media={media} />
  } else if (type === 'video') {
    mediaTypeView = <MediaViewVideo media={media} />
  }

  return (
    <>
      {mediaTypeView}
    </>
  )
}