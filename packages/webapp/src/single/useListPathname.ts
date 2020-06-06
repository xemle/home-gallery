import { useState } from 'react';
import { useLocation } from "react-router-dom";
import { useLastLocation } from 'react-router-last-location';

const getListPathname = (location, lastLocation) => {
  if (location.state && location.state.listPathname) {
    return location.state.listPathname
  } else if (lastLocation && lastLocation.pathname) {
    return lastLocation.pathname;
  } else {
    return '/'
  }
}

export default () => {
  const location = useLocation();
  const lastLocation = useLastLocation();

  const [ listPathname ] = useState(getListPathname(location, lastLocation));

  return listPathname;
}
