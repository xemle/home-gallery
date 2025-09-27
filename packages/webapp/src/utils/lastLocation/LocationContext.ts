import { createContext } from 'react'

import { type Location, DefaultLocation } from './Location'

export const LocationContext = createContext<Location>(DefaultLocation)
