const path = require('path')

const getIndexName = filename => path.basename(filename).replace(/\.[^.]+$/, '')

const unitToFactor = {
  'B': 1,
  'K': 1 << 10,
  'M': 1 << 20,
  'G': 1 << 30,
  'T': (1 << 30) * (1 << 10),
  'P': (1 << 30) * (1 << 20),
}

const parseFilesize = filesize => {
  const match = filesize.toUpperCase().match(/^(\d+(\.\d+)?)(([PTGMK])([B])?|[B])?$/)
  if (!match) {
    return false
  }
  const [_, size, _1, byte, unit] = match
  const factor = unitToFactor[unit || byte || 'B']
  return parseFloat(size) * factor
}

module.exports = {
  getIndexName,
  parseFilesize
}