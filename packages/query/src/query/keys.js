const dateKeys = ['year', 'y', 'month', 'm', 'day', 'd', 'hour', 'H', 'minute', 'M']

const geoAliases = {lat: 'latitude', lon: 'longitude'}

const numericKeys = [...dateKeys, ...Object.keys(geoAliases), ...Object.values(geoAliases), 'filesize', 'height', 'width', 'ratio', 'duration', 'iso']

const textAliases = {street: 'road'}

const textKeys = [...Object.keys(textAliases), ...Object.values(textAliases), 'id', 'type', 'index', 'file', 'filename', 'path', 'ext', 'model', 'make', 'country', 'state', 'city', 'tag', 'object']

module.exports = {
  dateKeys,
  numericKeys,
  textKeys,
  aliases: {...geoAliases, ...textAliases},
}