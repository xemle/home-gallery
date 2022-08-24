const { getEntryMetaByKey } = require('./utils')

const log = require('@home-gallery/logger')('database.media.address')

const keyMapping = {
  hamlet: 'city',
  village: 'city',
  town: 'city',
}

const getAddress = (entry) => {
  let result = {};
  const geoReverse = getEntryMetaByKey(entry, 'geoReverse');
  if (!geoReverse) {
    return result
  } else if (!geoReverse.address) {
    log.warn(`No geo address found for entry ${entry} with geo coordinates ${geoReverse.lat}/${geoReverse.lon}. Skip address`)
    return result
  }

  result.addresstype = geoReverse.addresstype

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

module.exports = {
  getAddress
}
