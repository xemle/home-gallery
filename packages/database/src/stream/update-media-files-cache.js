import Logger from '@home-gallery/logger'

const log = Logger('database.cache.updateMedia');

import { through } from '@home-gallery/stream';

export const updateMediaFilesCache = (storage) => {
  return through((media, enc, cb) => {
    storage.updateMediaCache(media, (err) => {
      if (err) {
        log.warn(err, `Could not write media files cache: ${err}`)
      }
      cb(null, media);
    })
  })
}
