import Logger from '@home-gallery/logger'

const log = Logger('database.media')

import { getEntryDate } from './date.js'
import { getVibrantColors } from './vibrant-colors.js'
import { exifMapper } from './exif.js'
import { getVideo } from './video.js'

import { getTags } from './tags.js'
import { getFiles } from './files.js'
import { getPreviews } from './previews.js'
import { toPlugin } from './plugin-utils.js';
import { addressMapper } from './address.js';
import { geoLocationMapper } from './geo.js';
import { similarityMapper } from './similarity.js';
import { objectMapper } from './objects.js';
import { faceMapper } from './faces.js';

const createMedia = (entry, orig = {}) => {
  const date = getEntryDate(entry) || entry.date
  const files = getFiles(entry)
  const previews = getPreviews(entry)
  const vibrantColors = getVibrantColors(entry)
  
  const video = getVideo(entry)
  
  const tags = getTags(entry)

  const media = Object.assign(orig, {
    groupIds: [],
    date,
    files,
    previews,
    vibrantColors,
    tags,
  }, video)

  return media
}

const baseDatabaseMapper = {
  name: 'baseMapper',
  mapEntry(entry, media) {
    return createMedia(entry, media)
  }
}

const databaseMappers = [
  baseDatabaseMapper,
  exifMapper,
  addressMapper,
  geoLocationMapper,
  similarityMapper,
  objectMapper,
  faceMapper
]

export default toPlugin(databaseMappers, 'baseMapper')