export const dateKeyAliases = {
  y: 'year',
  m: 'month',
  d: 'day',
  H: 'hour',
  M: 'minute',
}

export const geoKeyAliasMap = {
  lat: 'latitude',
  lon: 'longitude',
  lng: 'longitude'
}

export const textKeyAliasMap = {
  street: 'road'
}

export const keyAliasMap = {
  ...dateKeyAliases,
  ...geoKeyAliasMap,
  ...textKeyAliasMap
}
