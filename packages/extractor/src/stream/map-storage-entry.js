import { createReadStream } from 'fs'

import { map } from '@home-gallery/stream';
import { getFileTypeByExtension } from '@home-gallery/common';

export const mapToStorageEntry = map(({sha1sum, size, mtime, mtimeMs, indexName, url, filename}) => {
  const type = getFileTypeByExtension(filename);
  const date = mtime || new Date(mtimeMs);

  const src = url.match(/^file:\/\//) ? url.substr(7) : false;

  /**
   * @type {import('@home-gallery/types').TExtractorEntry}
   */
  return {
    indexName,
    filename,
    size,
    date,
    type,
    sha1sum,
    url,
    src,
    files: [],
    meta: {},
    sidecars: [],

    async getFile() {
      if (!src) {
        throw new Error(`No local file for url ${url}`)
      }
      return src
    },
    getStream() {
      if (!src) {
        throw new Error(`No local file for url ${url}`)
      }
      return createReadStream(src)
    },

    toString: function() {
      return `${this.sha1sum.substr(0, 7)}:${this.indexName}:${this.filename}`}
    };
})
