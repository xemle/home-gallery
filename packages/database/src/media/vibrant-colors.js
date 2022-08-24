const colorConvert = require('color-convert')

const { getEntryMetaByKey } = require('./utils')

const getVibrantColors = entry => {
  const vibrant = getEntryMetaByKey(entry, 'vibrant')
  if (!vibrant) {
    return []
  }
  return ['Vibrant', 'Muted']
    .map(k => (vibrant[k] || {}).rgb)
    .filter(v => !!v)
    .map(rgb => `#${colorConvert.rgb.hex(...rgb)}`)
}

module.exports = {
  getVibrantColors
}