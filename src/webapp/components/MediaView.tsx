import * as React from "react";
import {
  BrowserRouter as Router,
  useParams,
  useLocation,
  Link
} from "react-router-dom";
import { useLastLocation } from 'react-router-last-location';

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
  let index = -1;
  media.forEach((m, i) => {
    if (m.id === id) {
      index = i;
    }
  });
  return index;
}
export const MediaView = (props) => {
  let { id } = useParams();
  let location = useLocation();
  let lastLocation = useLastLocation();

  const mediaList = props.media || [];
  const index = getMediaIndex(mediaList, id);

  const media = mediaList[index];
  const prev = props.media[index - 1];
  const next = props.media[index + 1];

  const linkState = {
    uppathname: getUpPathName(location, lastLocation)
  }

  let mediaTypeView = <MediaViewUnknownType media={media}/>;
  if (media.type === 'image' || media.type === 'rawImage') {
    mediaTypeView = <MediaViewImage media={media} next={next} prev={prev}/>
  } else if (media.type === 'video') {
    mediaTypeView = <MediaViewVideo media={media} next={next} prev={prev}/>
  }

  return (
    <>
      <div className="media-nav">
        { prev &&
          <div className="media-nav__link media-nav__link--prev">
            <Link className="nav-link" to={{pathname:`/view/${prev.id}`, state: linkState}}>prev</Link>
          </div>
        }
        { linkState && linkState.uppathname &&
          <div className="media-nav__link media-nav__link--up">
            <Link className="nav-link" to={{pathname: linkState.uppathname}}>up</Link>
          </div>
        }
        { next &&
          <div className="media-nav__link media-nav__link--next">
            <Link className="nav-link" to={{pathname:`/view/${next.id}`, state: linkState}}>next</Link>
          </div>
        }
      </div>
      {mediaTypeView}
    </>
  )
}
