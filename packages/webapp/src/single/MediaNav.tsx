import * as React from "react";
import { useEffect } from "react";
import {
  Link
} from "react-router-dom";

import useBodyDimensions from "../utils/useBodyDimensions";
import { useStoreState } from '../store/hooks';

import { getLowerPreviewUrl } from '../utils/preview'

export const MediaNav = ({current, index, prev, next, listLocation, showNavigation, dispatch}) => {
  const { width } = useBodyDimensions();
  const query = useStoreState(state => state.search.query);
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

  useEffect(() => {
    let abort = false;
    const large = width <= 1280 ? 1280 : 1920;

    const timerId = setTimeout(async () => {
      prev && await loadImage(getLowerPreviewUrl(prev, 320))
      next && await loadImage(getLowerPreviewUrl(next, 320))
      !abort && prev && await loadImage(getLowerPreviewUrl(prev, large))
      !abort && next && await loadImage(getLowerPreviewUrl(next, large))
    }, 100);

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

