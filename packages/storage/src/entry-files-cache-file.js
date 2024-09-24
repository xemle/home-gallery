import path from 'path';
import { sha1Hex } from '@home-gallery/common';
import { getStoragePaths } from './storage-path.js';

export const getEntryFilesCacheKey = (entry) => {
  const { indexName, filename } = entry;
  const dirname = path.dirname(filename);
  return `${indexName}:${dirname}`;
}

export const getEntryFilesCacheId = (entry) => {
  const cacheKey = getEntryFilesCacheKey(entry);
  return sha1Hex(cacheKey);
}

export const getEntryFilesCacheFilename = (entry) => {
  const cacheId = getEntryFilesCacheId(entry)
  const {dir, prefix} = getStoragePaths(cacheId);
  return path.join(dir, `${prefix}-meta.cache`);
}
