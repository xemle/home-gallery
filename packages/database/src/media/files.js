const mapFile = ({sha1sum, indexName, type, size, filename}) => ({ id: sha1sum, index: indexName, type, size, filename })

export const getFiles = entry => {
  return [mapFile(entry)].concat(entry.sidecars.map(mapFile))
}
