import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { getLowerPreviewUrl, getHigherPreviewUrl } from '../utils/preview'
import { usePreviewSize } from "./usePreviewSize";
import { useClientRect } from '../utils/useClientRect'

export const MediaViewImage = (props) => {
  const imgRef = useRef<HTMLImageElement>();
  const imgRect = useClientRect(imgRef);
  const [faceRects, setFaceRects] = useState([]);
  const [objectRects, setObjectRects] = useState([]);
  const { showRects } = props;
  const { shortId, previews, faces, objects } = props.media;
  const navigate = useNavigate();
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

  const selectFace = (shortId, faceNo) => {
    console.log(`Search for face ${faceNo} of ${shortId}`);
    navigate(`/faces/${shortId}/${faceNo}`);
  }

  useEffect(() => {
    const e = imgRef.current;
    if (!e || !imgRect || !showRects) {
      return;
    }
    let { x, y, width, height } = imgRect;
    const { naturalWidth, naturalHeight } = e
    const rectRatio = width / height
    const naturalRatio = naturalWidth / naturalHeight

    if (rectRatio > naturalRatio) {
      const scale = height / naturalHeight
      const fixedWidth = scale * naturalWidth
      x += (width - fixedWidth) / 2
      width = fixedWidth
    } else {
      const scale = width / naturalWidth
      const fixedHeight = scale * naturalHeight
      y += (height - fixedHeight) / 2
      height = fixedHeight
    }

    setFaceRects(faces.map((face, i) => {
      const style: React.CSSProperties = {
        top: `${(y + face.y * height).toFixed()}px`,
        left: `${(x + face.x * width).toFixed()}px`,
        width: `${(face.width * width).toFixed()}px`,
        height: `${(face.height * height).toFixed()}px`,
      }
      return (
        <div key={i} className='absolute flex items-start border border-pink-700 rounded group hover:bg-pink-900/15 hover:cursor-pointer' style={style} onClick={() => selectFace(shortId, i)}>
          <span className="px-2 text-pink-700 rounded-br group-hover:bg-pink-700 group-hover:text-gray-200">{face.gender} ~{face.age}y</span>
        </div>
      );
    }))

    setObjectRects(objects.map((object, i) => {
      const style: React.CSSProperties = {
        top: `${(y + object.y * height).toFixed()}px`,
        left: `${(x + object.x * width).toFixed()}px`,
        width: `${(object.width * width).toFixed()}px`,
        height: `${(object.height * height).toFixed()}px`,
      }
      return (
        <div key={i} className='absolute flex items-start border border-green-700 rounded group hover:bg-green-900/15' style={style}>
          <span className="px-2 text-green-700 rounded-br group-hover:bg-green-700 group-hover:text-gray-200">{object.class}</span>
        </div>
      );
    }))
  }, [imgRef, imgRect, src, showRects])

  return (
    <>
      <div className="relative w-full h-full">
        <img ref={imgRef} className="absolute object-contain w-full h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" src={smallUrl} />
        <img className="absolute object-contain w-full h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" src={src} />
        {showRects && objectRects}
        {showRects && faceRects}
      </div>
    </>
  )
}
