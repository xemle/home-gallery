import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";

import useBodyDimensions from "../utils/useBodyDimensions";

export const MediaViewImage = (props) => {
  const imgRef = useRef<HTMLElement>();
  const [faceRects, setFaceRects] = useState([]);
  const [objectRects, setObjectRects] = useState([]);
  const { showDetails } = props;
  const { id, previews, faces, objects } = props.media;
  const { width } = useBodyDimensions();
  const history = useHistory();

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

  const selectFace = (id, faceNo) => {
    console.log(`Search for face ${faceNo} of ${id}`);
    history.push(`/faces/${id}/${faceNo}`);
  }

  useEffect(() => {
    const e = imgRef.current;
    if (!e || !showDetails) {
      return;
    }
    const { x, y, width, height } = e.getBoundingClientRect();
    console.log('bouding rect', x, y, width, height)

    setFaceRects(faces.map((face, i) => {
      const style: React.CSSProperties = {
        top: `${(y + face.y * height).toFixed()}px`,
        left: `${(x + face.x * width).toFixed()}px`,
        width: `${(face.width * width).toFixed()}px`,
        height: `${(face.height * height).toFixed()}px`,
      }
      return (
        <div key={i} className='annotation -face' style={style} onClick={() => selectFace(id, i)}>
          <span>{face.gender} ~{face.age}y</span>
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
        <div key={i} className='annotation -object' style={style}>
          <span>{object.class}</span>
        </div>
      );
    }))
  }, [imgRef, src, showDetails])

  return (
    <>
      <div className="mediaView -image">
        <img ref={imgRef} className="mediaView__media" src={smallUrl} />
        <img className="mediaView__media" src={src} />
        {showDetails && objectRects}
        {showDetails && faceRects}
      </div>
    </>
  )
}
