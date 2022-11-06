import { useState } from 'react';
import { useLocation } from "react-router-dom";
import { useLastLocation } from './lastLocation/useLastLocation'

const defaultListLocation = {
  pathname: '/',
  search: '',
  hash: ''
};

const getListLocation = (location, lastLocation) => {
  if (location?.state?.listLocation) {
    return location.state.listLocation
  } else if (lastLocation) {
    return lastLocation
  } else {
    return defaultListLocation
  }
}

export default () => {
  const location = useLocation();
  const lastLocation = useLastLocation();

  const [ listLocation ] = useState(getListLocation(location, lastLocation));

  return listLocation;
}
