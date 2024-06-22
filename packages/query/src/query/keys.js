export const dateKeys = ['year', 'y', 'month', 'm', 'day', 'd', 'hour', 'H', 'minute', 'M']

const geoAliases = {lat: 'latitude', lon: 'longitude', lng: 'longitude'}

export const numericKeys = [...dateKeys, ...Object.keys(geoAliases), ...Object.values(geoAliases), 'filesize', 'height', 'width', 'ratio', 'duration', 'iso']

export const rangeKeys = [...numericKeys, 'date']

const textAliases = {street: 'road'}

export const textKeys = [...Object.keys(textAliases), ...Object.values(textAliases), 'id', 'type', 'index', 'file', 'filename', 'path', 'ext', 'model', 'make', 'country', 'state', 'city', 'tag', 'object']

export const aliases = {...geoAliases, ...textAliases}
