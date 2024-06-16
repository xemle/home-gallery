import { map } from '@home-gallery/stream';
import { getFileTypeByExtension } from '@home-gallery/common';

export const mapToStorageEntry = map(({sha1sum, size, mtime, mtimeMs, indexName, url, filename}) => {
  const type = getFileTypeByExtension(filename);
  const date = mtime || new Date(mtimeMs);

  const src = url.match(/^file:\/\//) ? url.substr(7) : false;

  return {sha1sum, size, url, src, filename, indexName, type, date, files: [], meta: {}, sidecars: [], toString: function() { return `${this.sha1sum.substr(0, 7)}:${this.indexName}:${this.filename}`}};
})
