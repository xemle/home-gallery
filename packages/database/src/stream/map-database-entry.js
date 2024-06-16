import { map } from '@home-gallery/stream';
import { getFileTypeByExtension } from '@home-gallery/common';

export const mapToDatabaseEntry = map(({sha1sum, size, mtime, mtimeMs, url, indexName, filename}) => {
  const type = getFileTypeByExtension(filename);
  const date = mtime || new Date(mtimeMs);

  return {sha1sum, size, url, indexName, filename, type, date, files: [], meta: {}, sidecars: [], toString: function() { return `${this.sha1sum.substr(0, 7)}:${this.indexName}:${this.filename}`; } }
})
