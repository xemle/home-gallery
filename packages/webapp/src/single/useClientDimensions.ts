import { useState, useEffect } from 'react';

export default (ref) => {

  const getElementDimensions = e => {
    return { width: e.clientWidth || 0, height: e.clientHeight || 0 }
  }

  const [ dimensions, setDimensions ] = useState(getElementDimensions(ref.current || {}));

  useEffect(() => {
    const update = () => {
      setDimensions(getElementDimensions(ref.current || {}));
    }
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
    }
  }, [ref]);
  
  return dimensions;
}
