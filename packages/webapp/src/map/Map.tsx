import * as React from "react"
import { useCallback, useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { MapContainer, TileLayer } from 'react-leaflet'

import { NavBar } from '../navbar/NavBar'
import { useStoreState } from "easy-peasy"
import { FitBounds } from './FitBounds'
import { ClusterMarkers } from './ClusterMarker'
import useBodyDimensions from "../utils/body-dimensions"
import useListLocation from '../utils/useListLocation'
import { QueryParams } from "./queryParams"


export const Map = () => {
  const entries = useStoreState(state => state.entries.entries);
  const {width} = useBodyDimensions()
  const geoEntries = useMemo(() => entries.filter(e => e.latitude && e.longitude), [entries])

  const history = useHistory()
  const listLocation = useListLocation()

  const dispatch = useCallback(action => {
    const type = action.type
    switch (type) {
      case 'entryClick':
        const entry = action.entry
        history.push(`/view/${entry.shortId}`, {listLocation})
        break;
      case 'clusterClick':
        const cluster = action.cluster
        const {south, west, north, east} = cluster
        history.push(`/search/latitude in [${south.toFixed(4)}:${north.toFixed(4)}] and longitude in [${west.toFixed(4)}:${east.toFixed(4)}]`)
        break;
      case 'viewDateRange':
        history.push(`/search/date in ['${action.from.substring(0, 10)}':'${action.to.substring(0, 10)}']`)
        break;
      }
  }, [])

  return (
    <>
      <NavBar />
      <div style={{width: '100%', height: 'calc(100vh - 40px)', marginTop: 40}}>
        <MapContainer scrollWheelZoom={true} style={{width: '100%', height: '100%'}}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <QueryParams />
          <FitBounds entries={geoEntries} />
          <ClusterMarkers entries={geoEntries} width={width} dispatch={dispatch}/>
        </MapContainer>
      </div>
    </>
  )
}
