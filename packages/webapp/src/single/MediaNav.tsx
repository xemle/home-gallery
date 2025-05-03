import * as React from "react";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as icons from '@fortawesome/free-solid-svg-icons'

import { useSearchStore } from "../store/search-store";

import { getHigherPreviewUrl, getLowerPreviewUrl } from '../utils/preview'
import { usePreviewSize } from "./usePreviewSize";
import { classNames } from '../utils/class-names'

export const MediaNav = ({current, prev, next, listLocation, showNavigation, dispatch}) => {
  const query = useSearchStore(state => state.query);
  const previewSize = usePreviewSize()

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

    const preloadPrevNext = async () => {
      if (!abort) {
        await Promise.all([loadImage(getLowerPreviewUrl(next?.previews, previewSize / 4)), loadImage(getLowerPreviewUrl(prev?.previews, previewSize / 4))])
      }
      if (!abort) {
        await Promise.all([loadImage(getHigherPreviewUrl(next?.previews, previewSize)), loadImage(getHigherPreviewUrl(prev?.previews, previewSize))])
      }
    }

    const timerId = setTimeout(preloadPrevNext, 100);

    return () => {
      clearTimeout(timerId)
      abort = true;
    }
  }, [prev, next]);

  const itemClass = "md:opacity-40 hover:opacity-100 hover:cursor-pointer"
  const buttonClass = "block flex items-center justify-center rounded w-8 h-8 md:w-12 md:h-12"
  const buttonBgClass = "bg-gray-400/60 md:bg-gray-400/70"
  const iconClass = "md:text-2xl text-gray-800"

  const hasGeo = current?.latitude && current?.longitude && current.latitude != 0 && current.longitude != 0

  return (
    <>
      <div className={classNames('absolute z-10 top-4 right-4 flex gap-2')}>
        <a onClick={() => dispatch({type: 'list'})} className={classNames(buttonClass, itemClass, 'bg-transparent hover:bg-gray-400/40')} title="Show media stream (ESC)">
          <FontAwesomeIcon icon={icons.faXmark} className={iconClass}/>
        </a>
      </div>
      { prev &&
        <div className={classNames('absolute z-10 left-4 top-1/2 -translate-y-1/2', itemClass)}>
          <a onClick={() => dispatch({type: 'prev'})} className={classNames(buttonClass, buttonBgClass)} title="Show previous media (left arrow)">
            <FontAwesomeIcon icon={icons.faChevronLeft} className={iconClass}/>
          </a>
        </div>
      }
      { next &&
        <div className={classNames('absolute z-10 right-4 top-1/2 -translate-y-1/2', itemClass)}>
          <a onClick={() => dispatch({type: 'next'})} className={classNames(buttonClass, buttonBgClass)} title="Show next media (right arrow)">
            <FontAwesomeIcon icon={icons.faChevronRight} className={iconClass}/>
          </a>
        </div>
      }
      <div className={classNames('absolute z-10 bottom-4 left-1/2 -translate-x-1/2 flex gap-2')}>
        { listLocation &&
          <a onClick={() => dispatch({type: 'list'})} className={classNames(buttonClass, buttonBgClass, itemClass)} title="Show media stream (ESC)">
            <FontAwesomeIcon icon={icons.faTh} className={iconClass}/>
          </a>
        }
        { hasGeo &&
          <a onClick={() => dispatch({type: 'map'})} className={classNames(buttonClass, buttonBgClass, itemClass)} title="Show map of entry (m)">
            <FontAwesomeIcon icon={icons.faMap} className={iconClass}/>
          </a>
        }
        { current?.similarityHash &&
          <a onClick={() => dispatch({type: 'similar'})} className={classNames(buttonClass, buttonBgClass, itemClass)} title="Show similar images (s)">
            <FontAwesomeIcon icon={icons.faSeedling} className={iconClass}/>
          </a>
        }
        { query.type != 'none' &&
          <a onClick={() => dispatch({type: 'chronology'})} className={classNames(buttonClass, buttonBgClass, itemClass)} title="Show chronology (c)">
            <FontAwesomeIcon icon={icons.faClock} className={iconClass}/>
          </a>
        }
        { (current && (current?.faces?.length > 0 || current?.objects?.length > 0)) && 
          <a onClick={() => dispatch({type: 'toggleAnnotations'})} className={classNames(buttonClass, buttonBgClass, itemClass)} title="Show object and face annotations (a)">
            <FontAwesomeIcon icon={icons.faUsersViewfinder} className={iconClass}/>
          </a>
        }
        { current &&
          <a onClick={() => dispatch({type: 'toggleDetails'})} className={classNames(buttonClass, buttonBgClass, itemClass)} title="Show detail info (i)">
            <FontAwesomeIcon icon={icons.faInfo} className={iconClass}/>
          </a>
        }
      </div>
    </>
  )
}

