import { map } from '@home-gallery/stream';
import { getFileTypeByExtension } from '@home-gallery/common';

export const mapToDatabaseEntry = map(({sha1sum, size, mtime, mtimeMs, url, indexName, filename}) => {
  const type = getFileTypeByExtension(filename);
  const date = mtime || new Date(mtimeMs);

  return {
    indexName,
    filename,
    size,
    date,
    type,
    sha1sum,
    url,
    files: [],
    meta: {},
    sidecars: [],
    toString: function() {
      return `${this.sha1sum.substr(0, 7)}:${this.indexName}:${this.filename}`;
    }
  }

})
