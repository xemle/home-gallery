import colorConvert from 'color-convert'

import { getEntryMetaByKey } from './utils.js'

export const getVibrantColors = entry => {
  const vibrant = getEntryMetaByKey(entry, 'vibrant')
  if (!vibrant) {
    return []
  }
  return ['Vibrant', 'Muted']
    .map(k => (vibrant[k] || {}).rgb)
    .filter(v => !!v)
    .map(rgb => `#${colorConvert.rgb.hex(...rgb)}`)
}
