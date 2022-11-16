import { useState, useEffect } from 'react';
import { useLocation } from "react-router-dom";

const defaultListLocation = {
  pathname: '/',
  search: '',
  hash: ''
};

const getListLocation = (location) => {
  if (location?.state?.listLocation) {
    return location.state.listLocation
  } else if (location.pathname.match(/^\/(search|similar|faces)\//) ||
    location.pathname.match(/^\/years\/\d+/)) {
    return location
  } else {
    return defaultListLocation
  }
}

export default () => {
  const location = useLocation();

  const [ listLocation, setListLocation ] = useState(getListLocation(location));

  useEffect(() => {
    setListLocation(getListLocation(location))
  }, [location])

  return listLocation;
}
