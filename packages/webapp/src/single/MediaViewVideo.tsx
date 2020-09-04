import * as React from "react";

import { baseResolver } from '../base-resolver';

export const MediaViewVideo = (props) => {
  const { previews } = props.media;
  const base = baseResolver();

  return (
    <>
      <div className="mediaView -video">
        <video className="mediaView__media" controls poster={`${base}/files/${previews.filter(p => p.match(/image-preview-800/)).shift()}`}>
          <source src={`${base}/files/${previews.filter(p => p.match(/video-preview/)).shift()}`}  type="video/mp4" />
          No native video element support. Watch video file from <a href={`${base}/files/${previews.filter(p => p.match(/video-preview/)).shift()}`}>here</a>
        </video>
      </div>
    </>
  )
}
