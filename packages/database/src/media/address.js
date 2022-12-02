const { getMetaEntries } = require('./utils')

const log = require('@home-gallery/logger')('database.media.address')

const keyMapping = {
  hamlet: 'city',
  village: 'city',
  town: 'city',
}

const createAddress = (entry) => {
  const geoReverse = entry.meta?.geoReverse
  if (!geoReverse) {
    return false
  } else if (!geoReverse.address) {
    log.warn(`No geo address found for entry ${entry} with geo coordinates ${geoReverse.lat}/${geoReverse.lon}. Skip address`)
    return false
  }

  const result = {
    addresstype: geoReverse.addresstype
  }

  const address = geoReverse.address
  // Unify city information: hamlet < village < town < city. Latest wins
  const addressKeys = ['country', 'state', 'hamlet', 'village', 'town', 'city', 'road', 'house_number']
  addressKeys.forEach(key => {
    if (address[key]) {
      const infoKey = keyMapping[key] || key
      result[infoKey] = address[key]
    }
  })

  return result
}

const getAddress = (entry) => {
  const metaEntries = getMetaEntries(entry)
  const metaAddress = metaEntries.reduce((address, entry) => address || createAddress(entry), false)
  if (metaAddress) {
    return metaAddress
  }

  const allEntries = [entry, ...(entry.sidecars || [])]
  const allAddress = allEntries.reduce((address, entry) => address || createAddress(entry), false)
  return allAddress ? allAddress : {}
}

module.exports = {
  getAddress
}
