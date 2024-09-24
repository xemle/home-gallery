import path from 'path'

import { GalleryFileType, readJsonGzip, writeJsonGzip } from '@home-gallery/common';

export const mediaCacheFiletype = new GalleryFileType('home-galler/mediaCache@1.0')

export function createMediaCache() {
  return {
    type: mediaCacheFiletype.toString(),
    created: new Date().toISOString(),
    data: {}
  }
}

export function readMediaCache(storageDir, cacheFilename, cb) {
  readJsonGzip(path.resolve(storageDir, cacheFilename), cb);
}

export function readOrCreateMediaCache(storageDir, cacheFilename, cb) {
  readMediaCache(storageDir, cacheFilename, (err, data) => {
    if (err && err.code === 'ENOENT') {
      return cb(null, createMediaCache());
    } else if (err) {
      return cb(new Error(`Failed to read MediaCache ${cacheFilename} from storage`, {cause: err}));
    } else if (!mediaCacheFiletype.isCompatibleType(data?.type)) {
      return cb(new Error(`Incompatible data type ${data?.type}. Expected ${mediaCacheFiletype}`));
    }
    cb(null, data);
  })
}

function writeMediaCache(storageDir, cacheFilename, data, cb) {
  writeJsonGzip(path.resolve(storageDir, cacheFilename), {...data, ...{created: new Date().toISOString()}}, cb);
}

export function updateMediaCache(storageDir, cacheFilename, media, cb) {
  if (!media.length) {
    const cache = createMediaCache()
    return cb(null, cache);
  }

  readOrCreateMediaCache(storageDir, cacheFilename, (err, cache) => {
    if (err) {
      return cb(err);
    }

    media.forEach((media) => {
      const {index, filename} = media.files[0] || {}
      const cacheKey = `${index}:${filename || 'unknownFile'}`
      cache.data[cacheKey] = media;
    });

    writeMediaCache(storageDir, cacheFilename, cache, cb);
  });
}
