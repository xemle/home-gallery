import * as React from "react";
import { useState, useEffect, useRef } from "react";

import useBodyDimensions from "../utils/useBodyDimensions";

export const MediaViewImage = (props) => {
  const { id, previews } = props.media;
  const { width } = useBodyDimensions();

  const largeSize = width <= 1280 ? 1280 : 1920;
  const smallUrl = `files/${previews.filter(p => p.indexOf('image-preview-320.') >= 0)[0]}`;
  const largeUrl = `files/${previews.filter(p => p.indexOf(`image-preview-${largeSize}.`) >= 0)[0]}`;
  const [src, setSrc] = useState('');

  useEffect(() => {
    const img = new Image();
    img.addEventListener('load', () => {
      setSrc(largeUrl);
    });
    img.src = largeUrl;
  }, []);

  return (
    <>
      <div className="mediaView -image">
        <img className="mediaView__media" src={smallUrl} />
        <img className="mediaView__media" src={src} />
      </div>
    </>
  )
}
