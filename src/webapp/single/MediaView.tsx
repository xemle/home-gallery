import * as React from "react";
import { useEffect } from "react";
import {
  BrowserRouter as Router,
  useParams,
  useLocation,
  Link
} from "react-router-dom";
import { useLastLocation } from 'react-router-last-location';

import { useStoreState } from '../store/hooks';

import useBodyDimensions from "../utils/useBodyDimensions";
import { MediaViewUnknownType } from './MediaViewUnknownType';
import { MediaViewImage } from './MediaViewImage';
import { MediaViewVideo } from './MediaViewVideo';

function getUpPathName(location, lastLocation) {
  if (location.state && location.state.uppathname) {
    return location.state.uppathname
  } else if (lastLocation && lastLocation.pathname) {
    return lastLocation.pathname;
  } else {
    return '/'
  }
}

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
  let lastLocation = useLastLocation();
  const { width } = useBodyDimensions();

  const entries = useStoreState(state => state.entries.entries);
  let index = location.state && location.state.index ? location.state.index : getMediaIndex(entries, id);

  const media = entries[index];
  const prev = entries[index - 1];
  const next = entries[index + 1];

  const linkState = {
    uppathname: getUpPathName(location, lastLocation)
  }

  let mediaTypeView = <MediaViewUnknownType media={media}/>;
  if (media.type === 'image' || media.type === 'rawImage') {
    mediaTypeView = <MediaViewImage key={media.id} media={media} next={next} prev={prev}/>
  } else if (media.type === 'video') {
    mediaTypeView = <MediaViewVideo key={media.id} media={media} next={next} prev={prev}/>
  }

  const loadImage = async url => {
    return new Promise((resolve, reject) => {
      if (!url) {
        return
      }
      const img = new Image();
      img.addEventListener('load', resolve);
      img.src = url;
    });
  }

  const getPreviewUrl = (media, size) => '/files/' + media.previews.filter(p => p.indexOf(`image-preview-${size}.`) >= 0).shift();

  useEffect(() => {
    let abort = false;
    const large = width <= 1280 ? 1280 : 1920;

    setTimeout(async () => {
      prev && await loadImage(getPreviewUrl(prev, 320))
      next && await loadImage(getPreviewUrl(next, 320))
      !abort && prev && await loadImage(getPreviewUrl(prev, large))
      !abort && next && await loadImage(getPreviewUrl(next, large))
    }, 100);

    return () => {
      abort = true;
    }
  }, [prev, next]);

  return (
    <>
      <div className="media-nav">
        { prev &&
          <div className="media-nav__link media-nav__link--prev">
            <Link className="nav-link" to={{pathname:`/view/${prev.id}`, state: {...linkState, index: index - 1} }}>prev</Link>
          </div>
        }
        { linkState && linkState.uppathname &&
          <div className="media-nav__link media-nav__link--up">
            <Link className="nav-link" to={{pathname: linkState.uppathname}}>up</Link>
          </div>
        }
        { next &&
          <div className="media-nav__link media-nav__link--next">
            <Link className="nav-link" to={{pathname:`/view/${next.id}`, state: {...linkState, index: index + 1} }}>next</Link>
          </div>
        }
      </div>
      {mediaTypeView}
    </>
  )
}
