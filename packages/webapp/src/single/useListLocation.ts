import { useState } from 'react';
import { useLocation } from "react-router-dom";
import { useLastLocation } from 'react-router-last-location';

const defaultListLocation = {
  pathname: '/',
  search: '',
  hash: ''
};

const getListPathname = (location, lastLocation) => {
  if (location?.state?.listLocation) {
    return location.state.listLocation
  } else if (lastLocation?.pathname) {
    return lastLocation;
  } else {
    return defaultListLocation
  }
}

export default () => {
  const location = useLocation();
  const lastLocation = useLastLocation();

  const [ listLocation ] = useState(getListPathname(location, lastLocation));

  return listLocation;
}
