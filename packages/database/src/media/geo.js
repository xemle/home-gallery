import { getMetaEntries } from './utils.js'

const getExifGeo = exif => {
  if (!exif) {
    return false
  }

  const { GPSLatitude, GPSLongitude, GPSAltitude } = exif
  if (!GPSLatitude || !GPSLongitude) {
    return false
  }

  return {
    latitude: +GPSLatitude.toFixed(5),
    longitude: +GPSLongitude.toFixed(5),
    altitude: +GPSAltitude?.toFixed(2) || 0,
  }
}

export const getGeo = (entry) => {
  const metaEntries = getMetaEntries(entry)
  const metaGeo = metaEntries.reduce((geo, entry) => geo || getExifGeo(entry.meta?.exif), false)
  if (metaGeo) {
    return metaGeo
  }

  const allEntries = [entry, ...(entry.sidecars || [])]
  const allGeo = allEntries.reduce((geo, entry) => geo || getExifGeo(entry.meta?.exif), false)
  return allGeo ? allGeo : {}
}
