import * as React from "react";
import {useState, useRef, useLayoutEffect, useEffect} from 'react';
import {MediaGrid} from "./MediaGrid";

const useClientWidth = (ref) => {
  function getOffsetWidth() {
    return ref && ref.current ? ref.current.offsetWidth : 0;
  }

  const [width, setWidth] = useState(0);

  function updateWidth() {
    setWidth(getOffsetWidth());   
  }

  useLayoutEffect(() => {
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [ref])

  return width;
} 

export const Grid = (props) => {
  const container = useRef(null);
  const width = useClientWidth(container);

  return ( 
    <>
      <h1 ref={container}>Grid {props.media.length} {width}</h1>
      <MediaGrid media={props.media}/>
    </>
  )
}