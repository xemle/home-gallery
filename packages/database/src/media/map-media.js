const { through } = require('@home-gallery/stream');
const { serialize, createHash } = require('@home-gallery/common');

const log = require('@home-gallery/logger')('database.media')

const { getEntryDate } = require('./date')
const { getVibrantColors } = require('./vibrant-colors')
const { getExif } = require('./exif')
const { getVideo } = require('./video')
const { getAddress } = require('./address')
const { getGeo} = require('./geo')
const { getTags } = require('./tags')
const { getSimilarityHash } = require('./similarity')
const { getObjects } = require('./objects')
const { getFaces } = require('./faces')
const { getFiles } = require('./files')
const { getPreviews } = require('./previews')

const createMedia = (entry, updated) => {
  const date = getEntryDate(entry) || entry.date
  const files = getFiles(entry)
  const previews = getPreviews(entry)
  const vibrantColors = getVibrantColors(entry)
  
  const exif = getExif(entry)
  const video = getVideo(entry)
  const address = getAddress(entry)
  const geo = getGeo(entry)
  
  const tags = getTags(entry)
  const similarityHash = getSimilarityHash(entry)
  const objects = getObjects(entry, 0.6)
  const faces = getFaces(entry, 0.7)

  const media = Object.assign({
    id: entry.sha1sum,
    hash: '',
    type: entry.type,
    updated,
    date,
    files,
    previews,
    vibrantColors,
    tags,
    objects,
    faces
  }, exif, video, address, geo, similarityHash)

  media.hash = createHash(serialize(media, 'hash'))
  return media
}

const mapMedia = (updated) => {
  return through(function (entry, _, cb) {
    try {
      const media = createMedia(entry, updated)
      this.push(media)
    } catch (e) {
      log.warn(e, `Could not create media entry of ${entry}: ${e}. Skip it`)
    }
    cb()
  })
}

module.exports = mapMedia
