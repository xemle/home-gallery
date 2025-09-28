import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { getLowerPreviewUrl, getHigherPreviewUrl } from '../utils/preview'
import { usePreviewSize } from "./usePreviewSize";
import { useClientRect } from '../utils/useClientRect'
import { MediaAnnotations } from "./MediaAnnotations";

export const MediaViewImage = (props) => {
  const imgRef = useRef<HTMLImageElement>();
  const { showAnnotations, zoomFactor = 1 } = props;
  const { previews, fullSize } = props.media;
  const previewSize = usePreviewSize()

  const smallUrl = getLowerPreviewUrl(previews, previewSize / 4)
  const largeUrl = getHigherPreviewUrl(previews, previewSize)
  const [src, setSrc] = useState('');

  useEffect(() => {
    if (!largeUrl) {
      return
    }
    const img = new Image();
    img.addEventListener('load', () => {
      setSrc(largeUrl);
    });
    img.src = largeUrl;
  }, []);

  return (
    <>
      <div className="relative w-full h-full">
        <img ref={imgRef} className="absolute object-contain w-full h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" src={smallUrl} />
        <img className="absolute object-contain w-full h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" src={src} />
        {showAnnotations && <MediaAnnotations media={props.media} imgRef={imgRef} src={src || ''} />}
      </div>
    </>
  )
}
