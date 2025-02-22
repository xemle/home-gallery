import Logger from '@home-gallery/logger'

const log = Logger('database.media.exif')

import { getEntryMetaByKey } from './utils.js'

const getFractionNumber = (exif, prop) => {
  let result = {}
  if (!exif[prop]) {
    return result
  }
  result[`${prop}Raw`] = exif[prop]
  const match = exif[prop].toString().match(/^(\d+)\/(\d+)$/)
  if (match) {
    result[`${prop}Value`] = (+match[1] / +match[2])
    result[`${prop}Numerator`] = +match[1]
    result[`${prop}Divider`] = +match[2]
  } else if (typeof exif[prop] === 'number') {
    result[`${prop}Value`] = exif[prop]
  } else {
    result[`${prop}Value`] = +exif[prop]
  }
  return result
}

const widthHeight = (entry, exif) => {
  let width = exif.ImageWidth
  let height = exif.ImageHeight
  if (exif.Orientation >= 5) {
    width = exif.ImageHeight
    height = exif.ImageWidth
  }

  if (!width || !height) {
    let fixWidth = width
    let fixHeight = height
    if (width) {
      fixHeight = width
    } else if (height) {
      fixWidth = height
    } else {
      fixWidth = 1280
      fixHeight = 1280
    }
    log.warn(`Entry ${entry} has no valid width/height: ${width}/${height}. Fix it to ${fixWidth}/${fixHeight}`)
    width = fixWidth
    height = fixHeight
  }
  return [width, height]
}

const getExif = (entry) => {
  const exif = getEntryMetaByKey(entry, 'exif')
  if (!exif) {
    return {}
  }

  function getExposerTime() {
    return getFractionNumber(exif, 'ExposerTime')
  }

  function getShutterSpeed() {
    return getFractionNumber(exif, 'ShutterSpeed')
  }

  const [width, height] = widthHeight(entry, exif)

  return Object.assign({
    tz: exif.tz,
    width,
    height,
    orientation: exif.Orientation || 1,
    duration: exif.MediaDuration || exif.Duration || 0,
    make: exif.Make || 'unknown',
    model: exif.Model || 'unknown',
    iso: exif.ISO,
    aperture: exif.ApertureValue || exif.Aperture,
    exposureMode: exif.ExposureMode,
    focalLength: exif.FocalLength ? +(exif.FocalLength.replace(' mm', '')) : -1,
    focalLength33mm: exif.FocalLengthIn35mmFormat ? +(exif.FocalLengthIn35mmFormat.replace(' mm', '')) : -1,
    whiteBalance: exif.WhiteBalance
  }, getExposerTime(), getShutterSpeed())
}

export const exifMapper = {
  name: 'exifMapper',
  mapEntry(entry, media) {
    return {...media, ...getExif(entry)}
  }
}