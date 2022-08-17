import * as React from "react"
import { useState, useMemo, useEffect } from 'react'
import { useMap, Marker, Popup, useMapEvents } from 'react-leaflet'
import * as L from 'leaflet'

import { clusterEntries } from './cluster'
import { EntryMarker } from './EntryMarker'

import { getHigherPreviewUrl } from '../utils/preview'
import { formatDate } from '../utils/format'

const minFn = (a, b, fn) => fn(a) <= fn(b) ? a : b

const maxFn = (a, b, fn) => fn(a) >= fn(b) ? a : b

const ClusterDate = ({cluster, dispatch}) => {
  const [minEntry, maxEntry] = useMemo(() => {
    return cluster.entries.reduce(([min, max], entry) => {
      return [min ? minFn(min, entry, e => e.date) : entry, max ? maxFn(max, entry, e => e.date) : entry]
    }, [null, null])
  }, [cluster])

  const [fromDate, toDate] = useMemo(() => {
    const minDate = minEntry.date
    const maxDate = maxEntry.date
    const diffDays = (new Date(maxDate).getTime() - new Date(minDate).getTime()) / (24 * 3600 * 1000)

    let format = diffDays > 365 ? '%Y' : '%d.%m.%Y'
    return [formatDate(format, minDate), formatDate(format, maxDate)]
  }, [minEntry, maxEntry])

  return (
    <>
      { fromDate != toDate &&
        <p><a className="link" onClick={() => dispatch({type: 'viewDateRange', from: minEntry.date, to: maxEntry.date})}>View all from {fromDate} to {toDate}</a></p>
      }
      { fromDate == toDate &&
        <p><a className="link" onClick={() => dispatch({type: 'viewDateRange', from: minEntry.date, to: maxEntry.date})}>View all at {fromDate}</a></p>
      }
    </>
  )
}

export const ClusterMarker = ({cluster, dispatch}) => {
  const entry = cluster.entries[0]

  const icon = useMemo(() => {
    return L.divIcon({
      iconSize: L.point(1, 1),
      html: `<div class="map-cluster">${cluster.length}</div>`
    })
  }, [cluster])


  return (
    <>
      <Marker key={entry.id} position={cluster.center} icon={icon}>
        <Popup closeButton={false}>
          <div className="cluster-grid" onClick={() => dispatch({type: 'clusterClick', cluster})}>
            {cluster.entries.slice(0, 16).map(entry => {
              return (
                <img src={getHigherPreviewUrl(entry.previews, 48)} width="48" height="48"/>
              )
            })}
          </div>
          {cluster.length > 16 &&
            <p><a className="link" onClick={() => dispatch({type: 'clusterClick', cluster})}>and view {cluster.length - 16} more...</a></p>
          }
          <ClusterDate cluster={cluster} dispatch={dispatch}/>
        </Popup>
      </Marker>
    </>
  )
}

const inBounds = (entry, bounds: L.LatLngBounds) => {
  const {latitude, longitude} = entry
  return bounds.getWest() <= longitude && longitude <= bounds.getEast() &&
    bounds.getSouth() <= latitude && latitude <= bounds.getNorth()
}

const MAX_BOUNDS = L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180))

export const ClusterMarkers = ({entries, width, dispatch}) => {
  const map = useMap()
  const [bounds, setBounds] = useState(MAX_BOUNDS)

  useMapEvents({
    load() {
      setBounds(map.getBounds())
    },
    moveend() {
      setBounds(map.getBounds())
    },
    zoomend() {
      setBounds(map.getBounds())
    },
  })

  useEffect(() => {
    setBounds(map.getBounds())
  }, [])

  const distance = useMemo(() => {
    const longitudeDiff = bounds.getEast() - bounds.getWest()
    return 32 * longitudeDiff / width
  }, [width, bounds])

  const [viewClusters, viewEntries] = useMemo(() => {
    const entriesInBound = entries.filter(entry => inBounds(entry, bounds))
    const clusters = clusterEntries(entriesInBound, distance)

    // console.log(`Found ${clusters.length} clusters from ${entriesInBound.length} entries in view of ${entries.length} entries in total in ${bounds.toBBoxString()}`)

    return clusters.reduce(([clusters, entries], cluster) => {
      if (cluster.length < 5) {
        entries.push(...cluster.entries)
      } else {
        clusters.push(cluster)
      }
      return [clusters, entries]
    }, [[], []])
  }, [entries, bounds, distance])

  return (
    <>
      {viewClusters.map(cluster => {
        return (
          <ClusterMarker key={cluster.center} cluster={cluster} dispatch={dispatch} />
        )
      })}
      {viewEntries.map(entry => {
        return (
          <EntryMarker key={entry.id} entry={entry} dispatch={dispatch}/>
        )
      })}
    </>
  )
}
