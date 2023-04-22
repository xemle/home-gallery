const os = require('os')

const isWindows = os.platform == 'win32'

const toUrlPath = isWindows ? p => p.split('\\').join('/') : p => p

const getAllStorageFiles = entry => [entry.files]
  .concat(entry.sidecars.map(sidecar => sidecar.files))
  .reduce((result, files) => { result.push(...files); return result }, [])

const getPreviews = entry => {
  return getAllStorageFiles(entry).filter(file => file.match(/-preview/)).map(toUrlPath)
}

module.exports = {
  getPreviews
}