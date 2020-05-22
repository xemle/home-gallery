import { useState, useEffect } from 'react';

import useBodyDimensions from './useBodyDimensions';

export enum DeviceType {
  MOBILE,
  DESKTOP
}

const getTypeByWidth = (width) => {
  if (width < 1280) {
    return DeviceType.MOBILE;
  } else {
    return DeviceType.DESKTOP;
  }
}

export const useDeviceType = () => {
  const { width } = useBodyDimensions();
  const [type, setType] = useState(getTypeByWidth(width));

  useEffect(() => {
    setType(getTypeByWidth(width));
  }, [width]);

  return [type];
}
