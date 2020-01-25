import { useState, useEffect } from 'react';

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
    const throttle = (fn, delay) => {
      let timerId;
      return () => {
        if (timerId) {
          return;
        }
        timerId = setTimeout(() => {
          timerId = undefined;
          fn();
        }, delay)
      }
    }

    const handleResize = () => {
      setBodyDimensions(getBodyDimensions());
    }

    const throttledResize = throttle(handleResize, 100);

    window.addEventListener('resize', throttledResize);
    return () => window.removeEventListener('resize', throttledResize);
  }, []);

  return bodyDimensions;
}