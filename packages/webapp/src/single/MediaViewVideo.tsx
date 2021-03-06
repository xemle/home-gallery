import * as React from "react";

export const MediaViewVideo = (props) => {
  const { previews } = props.media;

  return (
    <>
      <div className="mediaView -video">
        <video className="mediaView__media" controls poster={`files/${previews.filter(p => p.match(/image-preview-800/)).shift()}`}>
          <source src={`files/${previews.filter(p => p.match(/video-preview/)).shift()}`}  type="video/mp4" />
          No native video element support. Watch video file from <a href={`files/${previews.filter(p => p.match(/video-preview/)).shift()}`}>here</a>
        </video>
      </div>
    </>
  )
}
