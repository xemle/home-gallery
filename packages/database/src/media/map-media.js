import { through } from '@home-gallery/stream';
import { serialize, createHash } from '@home-gallery/common';

import Logger from '@home-gallery/logger'

const log = Logger('database.media')

import { getEntryDate } from './date.js'
import { getVibrantColors } from './vibrant-colors.js'
import { getExif } from './exif.js'
import { getVideo } from './video.js'
import { getAddress } from './address.js'
import { getGeo} from './geo.js'
import { getTags } from './tags.js'
import { getSimilarityHash } from './similarity.js'
import { getObjects } from './objects.js'
import { getFaces } from './faces.js'
import { getFiles } from './files.js'
import { getPreviews } from './previews.js'

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
    groupIds: [],
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

export const mapMedia = (updated) => {
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
