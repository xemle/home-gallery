import * as React from "react"
import { useMemo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import * as L from 'leaflet'

import { getHigherPreviewUrl } from '../utils/preview'
import { formatDate } from '../utils/format'

const ICON_SIZE = 64

const resize = (entry, size): [number, number] => {
  if (entry.width >= entry.height) {
    return [size, size * (entry.height / entry.width)]
  } else {
    return [size * (entry.width / entry.height), size]
  }
}

export const EntryMarker = ({entry, dispatch}) => {
  const icon = useMemo(() => L.icon({
    iconUrl: getHigherPreviewUrl(entry.previews, ICON_SIZE),
    iconSize: resize(entry, ICON_SIZE)
  }), [entry])

  const [width, height] = useMemo(() => resize(entry, 320), [entry])

  const position = useMemo(() => L.latLng(entry.latitude, entry.longitude), [entry])

  return (
    <Marker key={entry.id} position={position} icon={icon}>
      <Popup closeButton={false} minWidth={width} maxWidth={width}>
        <img src={getHigherPreviewUrl(entry.previews, 320)} width={width} height={height} onClick={() => dispatch({type: 'entryClick', entry})}/>
        <p>File: {entry.files[0].index}:{entry.files[0].filename}</p>
        <p>Date: {formatDate('%d.%m.%Y %H:%M', entry.date)}</p>
      </Popup>
    </Marker>
  )
}
