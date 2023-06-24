const log = require('@home-gallery/logger')('database.media.utils')

const getEntryMetaByKey = (entry, key) => {
  if (!entry.meta) {
    log.warn(`Meta data is missing for entry ${entry}`)
    return false
  } else if (entry.meta[key]) {
    return entry.meta[key]
  } else if (entry.sidecars?.length) {
    for (let i = 0; i < entry.sidecars.length; i++) {
      const sidecar = entry.sidecars[i]
      if (!sidecar.meta) {
        log.warn(`Missing meta data of sidecar ${sidecar} of entry ${entry}`)
      } else if (sidecar.meta && sidecar.meta[key]) {
        return sidecar.meta[key]
      }
    }
  }
  return false
}

const getAllEntryMetaByKey = (entry, key) => {
  const result = []
  if (entry.meta && entry.meta[key]) {
    result.push(entry.meta[key])
  }
  if (entry.sidecars && entry.sidecars.length) {
    entry.sidecars.forEach(sidecar => {
      if (sidecar.meta && sidecar.meta[key]) {
        result.push(sidecar.meta[key])
      }
    })
  }
  return result
}

const reduceMeta = (entry, key, reduceFn, initValue) => {
  const allMeta = getAllEntryMetaByKey(entry, key)
  return allMeta.reduce(reduceFn, initValue)
}

const getBasename = filename => filename.substring(0, filename.lastIndexOf('.'))

// Entry and sidecars are ordered by size:
//   [img_1234.dng, img_1234.jpg, img_1234.jpg.xmp, img_1234.xmp, img_1234.dng.xmp]
// Get meta sidecars by basename than by filesize of its main file:
//   [img_1234.xmp, img_1234.dng.xmp, img_1234.jpg.xmp]
function getMetaEntries(entry) {
  if (!entry.sidecars?.length) {
    return []
  }

  const basename2meta = entry.sidecars.reduce((result, sidecar) => {
    if (sidecar.type != 'meta') {
      return result
    }
    const basename = getBasename(sidecar.filename)
    if (!result[basename]) {
      result[basename] = []
    }
    result[basename].push(sidecar)
    return result
  }, {})

  return [entry, ...entry.sidecars].reduce((result, {filename}) => {
    const basename = getBasename(filename)
    if (basename2meta[basename]) {
      result.push(...basename2meta[basename])
      basename2meta[basename] = []
    }
    if (basename2meta[filename]) {
      result.push(...basename2meta[filename])
      basename2meta[filename] = []
    }
    return result
  }, [])
}

const toArray = value => {
  if (Array.isArray(value)) {
    return value
  } else if (value) {
    return [value]
  } else {
    return []
  }
}

module.exports = {
  getEntryMetaByKey,
  getAllEntryMetaByKey,
  reduceMeta,
  getMetaEntries,
  toArray
}