import { createContext } from 'react'

import { Location, DefaultLocation } from './Location'

export const LocationContext = createContext<Location>(DefaultLocation)
