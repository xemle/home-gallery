import { useContext } from 'react'
import { LocationContext } from './LocationContext'

export const useLastLocation = () => {
  return useContext(LocationContext);
}
