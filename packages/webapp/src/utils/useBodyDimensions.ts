import { useState, useEffect } from 'react';

import { throttle } from './throttle'; 

function getBodyDimensions() {
  const { clientWidth: width, clientHeight: height } = document.documentElement;
  return {
    width,
    height
  };
}

export default function useBodyDimensions() {
  const [bodyDimensions, setBodyDimensions] = useState(getBodyDimensions());

  useEffect(() => {
    const resizeHandler = throttle(() => {
      setBodyDimensions(getBodyDimensions());
    }, 100);

    setBodyDimensions(getBodyDimensions());
    window.addEventListener('resize', resizeHandler);
    return () => window.removeEventListener('resize', resizeHandler);
  }, []);

  return bodyDimensions;
}
