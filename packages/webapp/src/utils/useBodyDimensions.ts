import { useState, useLayoutEffect } from 'react';

import { throttle } from './throttle'; 

function getBodyDimensions() {
  const { clientWidth: width, clientHeight: height } = document.documentElement;
  return {
    width,
    height
  };
}

function requestNAnimationFrames(n, cb) {
  requestAnimationFrame(() => {
    n--;

    if (n <= 0) {
      cb();
    } else {
      requestNAnimationFrames(n, cb);
    }
  })
}

export default function useBodyDimensions() {
  const [bodyDimensions, setBodyDimensions] = useState(getBodyDimensions());

  useLayoutEffect(() => {
    const resizeHandler = throttle(() => {
      setBodyDimensions(getBodyDimensions());
    }, 100);

    console.log(`useBodyDimenstions:useLayoutEffect`);
    setBodyDimensions(getBodyDimensions());
    window.addEventListener('resize', resizeHandler);
    return () => window.removeEventListener('resize', resizeHandler);
  }, []);

  return bodyDimensions;
}
