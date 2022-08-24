const getAllStorageFiles = entry => [entry.files]
  .concat(entry.sidecars.map(sidecar => sidecar.files))
  .reduce((result, files) => { result.push(...files); return result }, [])

const getPreviews = entry => {
  return getAllStorageFiles(entry).filter(file => file.match(/-preview/))
}

module.exports = {
  getPreviews
}