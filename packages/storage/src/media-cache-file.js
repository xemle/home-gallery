import path from 'path';
import { sha1Hex } from '@home-gallery/common';
import { getStoragePaths } from './storage-path.js';

export const getMediaCacheKey = (media) => {
  const { indexName, filename } = media.files[0] || {}
  const dirname = path.dirname(filename);
  return `${indexName}:${dirname}`;
}

export const getMediaCacheId = (media) => {
  const cacheKey = getMediaCacheKey(media);
  return sha1Hex(cacheKey);
}

export const getMediaCacheFilename = (media) => {
  const cacheId = getMediaCacheId(media)
  const {dir, prefix} = getStoragePaths(cacheId);
  return path.join(dir, `${prefix}-media.cache`);
}
