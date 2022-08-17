import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useMap } from 'react-leaflet'
import * as L from 'leaflet'

const getBoundsByEntries = (entries): L.LatLngBounds => {
  const [south, west, north, east] = entries.reduce(([south, west, north, east], entry) => {
    return [
      Math.min(south, entry.latitude), 
      Math.min(west, entry.longitude),
      Math.max(north, entry.latitude),
      Math.max(east, entry.longitude)
    ]
  }, [90, 180, -90, -180])
  return L.latLngBounds(L.latLng(south, west), L.latLng(north, east))
}

export const FitBounds = ({entries}) => {
  const map = useMap()
  const location = useLocation()
  const params = Object.fromEntries(new URLSearchParams(location.search).entries())

  const [entryBounds, setEntryBounds] = useState(getBoundsByEntries(entries))
  const [isPristine, setIsPristine] = useState(!params.lat && !params.lng)

  useEffect(() => {
    if (params.lat && params.lng) {
      console.log(`Set center`, map)
      map.setView(L.latLng(+params.lat, +params.lng), +params.zoom || 0)
    } else {
      map.fitBounds(entryBounds)
    }
  }, [])

  useEffect(() => {
    let isResetting = false

    const onChange = e => {
      if (e.type == 'movestart' || e.type == 'zoomstart' && !isResetting) {
        setIsPristine(pristine => {
          if (pristine) {
            console.log(`Set pristine map to false`)
          }
          return false
        })
      }
      if (e.type == 'moveend' || e.type == 'zoomend') {
        isResetting = false
      }
    }

    const bounds = getBoundsByEntries(entries)
    if (!bounds.equals(entryBounds) && isPristine) {
      setEntryBounds(bounds)
      isResetting = true
      map.fitBounds(bounds)
      console.log(`Set map bounds to ${bounds.toBBoxString()} for new geo entries`)
    }

    map.on('zoomstart', onChange)
    map.on('movestart', onChange)
    map.on('zoomend', onChange)
    map.on('moveend', onChange)

    return () => {
      map.off('zoomstart', onChange)
      map.off('movestart', onChange)
      map.off('zoomend', onChange)
      map.off('moveend', onChange)
    }
  }, [entries, isPristine])

  return null
}