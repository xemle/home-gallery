import * as React from "react";

export const MediaViewUnknownType = (props) => {
  const { id, type } = props.media || {};
  
  return (
    <>
      <div className="mediaView">
        <h1>Unsopported Media type {type} of {id}</h1>
      </div>
    </>
  )
}