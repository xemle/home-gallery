import * as React from "react";
import { useEffect } from "react";

import useBodyDimensions from "../utils/useBodyDimensions";
import { useSearchStore } from "../store/search-store";

import { getLowerPreviewUrl } from '../utils/preview'
import { resourceLimits } from "worker_threads";

export const MediaNav = ({current, index, prev, next, listLocation, showNavigation, dispatch}) => {
  const { width } = useBodyDimensions();
  const query = useSearchStore(state => state.query);

  const loadImage = async (url: string | false) => {
    return new Promise((resolve) => {
      if (!url) {
        return resolve(true)
      }
      const img = new Image();
      img.addEventListener('load', resolve);
      img.addEventListener('error', resolve);
      img.src = url;
    });
  }

  useEffect(() => {
    let abort = false;
    const large = width <= 1280 ? 1280 : 1920;

    const preloadPrevNext = async () => {
      if (!abort) {
        await Promise.all([loadImage(getLowerPreviewUrl(next?.previews, 320)), loadImage(getLowerPreviewUrl(prev?.previews, 320))])
      }
      if (!abort) {
        await Promise.all([loadImage(getLowerPreviewUrl(next?.previews, large)), loadImage(getLowerPreviewUrl(prev?.previews, large))])
      }
    }

    const timerId = setTimeout(preloadPrevNext, 100);

    return () => {
      clearTimeout(timerId)
      abort = true;
    }
  }, [prev, next]);

  const buttonClass = `mediaNav__button ${showNavigation ? '' : '-transparent'}`

  return (
    <>
      { prev &&
        <div className="mediaNav -left">
          <Link className={buttonClass} to={{pathname:`/view/${prev.shortId}`, state: {listLocation, index: index - 1} }}>
            <i className="fas fa-chevron-left fa-2x"></i>
          </Link>
        </div>
      }
      { next &&
        <div className="mediaNav -right">
          <Link className={buttonClass} to={{pathname:`/view/${next.shortId}`, state: {listLocation, index: index + 1} }}>
            <i className="fas fa-chevron-right fa-2x"></i>
          </Link>
        </div>
      }
      { <div className="mediaNav -bottom">
        { listLocation &&
          <Link className={buttonClass} to={listLocation} title="Show media stream (ESC)">
            <i className="fas fa-th fa-2x"></i>
          </Link>
        }
        { current.latitude != 0 && current.longitude != 0 &&
          <a onClick={() => dispatch({type: 'map'})} className={buttonClass} title="Show map of entry (m)">
            <i className="fas fa-map fa-2x"></i>
          </a>
        }
        { current?.similarityHash &&
          <a onClick={() => dispatch({type: 'similar'})} className={buttonClass} title="Show similar images (s)">
            <i className="fas fa-seedling fa-2x"></i>
          </a>
        }
        { query.type != 'none' &&
          <a onClick={() => dispatch({type: 'chronology'})} className={buttonClass} title="Show chronology">
            <i className="fas fa-clock fa-2x"></i>
          </a>
        }
        <a onClick={() => dispatch({type: 'toggleDetails'})} className={buttonClass} title="Show info">
          <i className="fas fa-info fa-2x"></i>
        </a>
        </div>
      }
    </>
  )
}

