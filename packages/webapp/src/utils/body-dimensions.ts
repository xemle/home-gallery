import { useState, useEffect } from 'react';

import { throttle } from './throttle';

function getBodyDimensions() {
  const { clientWidth: width, clientHeight: height } = document.documentElement;
  return {
    width,
    height
  };
}

const watch = (fn, ms, onChange) => {
  let oldValue = JSON.stringify(fn());

  const intervalId = setInterval(() => {
    const currentValue = fn();
    if (oldValue != JSON.stringify(currentValue)) {
      onChange(currentValue, oldValue);
      oldValue = currentValue;
    }
  }, ms)

  return () => {
    clearInterval(intervalId);
  }
}

export default function useBodyDimensions() {
  const [bodyDimensions, setBodyDimensions] = useState(getBodyDimensions());

  useEffect(() => {
    const resizeHandler = throttle(() => {
      setBodyDimensions(getBodyDimensions());
    }, 100);

    window.addEventListener('resize', resizeHandler);

    const stopWatcher = watch(getBodyDimensions, 100, newDimensions => {
      console.log(`dimensions changes ${JSON.stringify(newDimensions)}`)
      setBodyDimensions(newDimensions);
    })

    return () => {
      window.removeEventListener('resize', resizeHandler);
      stopWatcher();
    }
  }, []);

  return bodyDimensions;
}
