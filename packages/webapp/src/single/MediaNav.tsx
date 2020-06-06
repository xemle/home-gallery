import * as React from "react";
import { useEffect } from "react";
import {
  Link
} from "react-router-dom";

import useBodyDimensions from "../utils/useBodyDimensions";

export const MediaNav = ({index, prev, next, listPathname}) => {
  const { width } = useBodyDimensions();

  const loadImage = async url => {
    return new Promise((resolve) => {
      if (!url) {
        return
      }
      const img = new Image();
      img.addEventListener('load', resolve);
      img.src = url;
    });
  }

  const getPreviewUrl = (entry, size) => '/files/' + entry.previews.filter(p => p.indexOf(`image-preview-${size}.`) >= 0).shift();

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
      { prev &&
        <div className="mediaNav -left">
          <Link className="mediaNav__button" to={{pathname:`/view/${prev.id}`, state: {listPathname, index: index - 1} }}>
            <i className="fas fa-chevron-left fa-2x"></i>
          </Link>
        </div>
      }
      { listPathname &&
        <div className="mediaNav -center">
          <Link className="mediaNav__button" to={{pathname: listPathname}}>
            <i className="fas fa-chevron-up fa-2x"></i>
          </Link>
        </div>
      }
      { next &&
        <div className="mediaNav -right">
          <Link className="mediaNav__button" to={{pathname:`/view/${next.id}`, state: {listPathname, index: index + 1} }}>
            <i className="fas fa-chevron-right fa-2x"></i>
          </Link>
        </div>
      }
    </>
  )
}

