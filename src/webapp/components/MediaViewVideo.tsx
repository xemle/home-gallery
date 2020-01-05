import * as React from "react";

export const MediaViewVideo = (props) => {
  const { previews } = props.media;
  
  return (
    <>
      <div className="media-view media-view--video">
        <video className="media-view__media" controls poster={`/files/${previews.filter(p => p.match(/image-preview-800/)).pop()}`}>
          <source src={`/files/${previews.filter(p => p.match(/video-preview/)).pop()}`}  type="video/mp4" />
          No native video element support. Watch video file from <a href={`/files/${previews.filter(p => p.match(/video-preview/)).pop()}`}>here</a>
        </video>
      </div>
    </>
  )
}