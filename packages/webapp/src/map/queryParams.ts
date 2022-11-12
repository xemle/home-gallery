import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

import { useNavigate, useLocation } from 'react-router-dom'

const throttle = (fn, delay): [() => void, () => void] => {
  let id

  const wrapper = () => {
    if (id) {
      return
    }
    id = setTimeout(() => {
      id = false;
      fn()
    }, delay)
  }

  const cancel = () => clearTimeout(id)

  return [wrapper, cancel]
}

export const useQueryParams = () => {
  const map = useMap()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const [onChange, onChangeCancel] = throttle(() => {
      const {lat, lng} = map.getCenter()
      const zoom = map.getZoom()
      const search = new URLSearchParams({ lat: lat.toFixed(4), lng: lng.toFixed(4), zoom: `${zoom}` });
      navigate(`${location.pathname}?${search.toString()}`, {replace: true});
    }, 200)

    map.on('zoomend', onChange)
    map.on('moveend', onChange)

    return () => {
      map.off('zoomend', onChange)
      map.off('moveend', onChange)
      onChangeCancel()
    }
  }, [])

  return null
}

export const QueryParams = () => {
  useQueryParams()

  return null
}