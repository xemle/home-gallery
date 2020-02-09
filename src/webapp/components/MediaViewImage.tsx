import * as React from "react";

export const MediaViewImage = (props) => {
  const { id, previews } = props.media;
  
  return (
    <>
      <div className="media-view media-view--video">
        <img className="media-view__media" src={'files/' + previews.filter(p => p.match(/image-preview-1920/)).pop()} />
      </div>
    </>
  )
}