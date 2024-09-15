import Logger from '@home-gallery/logger'

const log = Logger('database.media.iptc')

const allEntriesByMetaAndSize = entry => [entry, ...entry.sidecars].sort((a, b) => {
  if (a.type != b.type) {
    return b.type == 'meta' ? 1 : -1 // meta entries first
  } else if (a.filename.length != b.filename.length) {
    return a.filename.length < b.filename.length ? -1 : 1 // shorter filenames first
  }
  return a.size < b.size ? 1 : -1 // larger filename first
})

const getIptc = (entry) => {
  const iptc = allEntriesByMetaAndSize(entry)
    .filter(entry => entry.meta.exif) // only with exif information
    .reduce((iptc, entry) => {
      const exif = entry.meta.exif
      if (!exif.ImageDescription) {
        return iptc
      } else if (iptc.description) {
        log.debug(`Skip image description from ${entry}: ${exif.ImageDescription}. Description is already set`)
      } else {
        log.trace(`Use image description from ${entry}: ${exif.ImageDescription}`)
        iptc.description = exif.ImageDescription
      }
      return iptc
    }, {})
  
  return iptc
}

export const iptcMapper = {
  name: 'iptcMapper',
  mapEntry(entry, media) {
    return {...media, ...getIptc(entry)}
  }
}