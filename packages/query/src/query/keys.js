const dateKeys = ['year', 'y', 'month', 'm', 'day', 'd', 'hour', 'H', 'minute', 'M']

const geoAliases = {lat: 'latitude', lon: 'longitude', lng: 'longitude'}

const numericKeys = [...dateKeys, ...Object.keys(geoAliases), ...Object.values(geoAliases), 'filesize', 'height', 'width', 'ratio', 'duration', 'iso']

const rangeKeys = [...numericKeys, 'date']

const textAliases = {street: 'road'}

const textKeys = [...Object.keys(textAliases), ...Object.values(textAliases), 'id', 'type', 'index', 'file', 'filename', 'path', 'ext', 'model', 'make', 'country', 'state', 'city', 'tag', 'object']

module.exports = {
  dateKeys,
  numericKeys,
  rangeKeys,
  textKeys,
  aliases: {...geoAliases, ...textAliases},
}