import { ReactNode } from 'react';
import { useState, useEffect, useContext, FC } from 'react'
import { LocationContext } from './LocationContext'
import { useLocation } from 'react-router-dom'
import { Location } from './Location';

export const useLastLocation = () => {
  const lastLocation = useContext(LocationContext);
  return lastLocation
}

const hasChanges = (currentLocation: Location, lastLocation: Location) => {
  return currentLocation.pathname != lastLocation.pathname ||
    currentLocation.search != lastLocation.search ||
    currentLocation.hash != lastLocation.hash
}

export function LastLocationProvider({children}: {children: ReactNode}): JSX.Element {
  const location = useLocation()

  const [lastLocation, setLastLocation] = useState<Location>(location)
  const [_, setCurrentLocation] = useState(location)

  useEffect(() => {
    setCurrentLocation(prevCurrentLocation => {
      if (hasChanges(prevCurrentLocation, location)) {
        console.log(`Set last location to`, prevCurrentLocation)
        setLastLocation(prevCurrentLocation)
      }
      return location
    })
  }, [location])

  return (
    <>
      <LocationContext.Provider value={lastLocation}>
        {children}
      </LocationContext.Provider>
    </>
  )
}