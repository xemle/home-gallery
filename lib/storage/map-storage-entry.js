const map = require('../stream/map');
const { getFileTypeByExtension } = require('../utils/file-types');

const mapToStorageEntry = map(({sha1sum, size, mtime, mtimeMs, url, filename}) => {
  const type = getFileTypeByExtension(filename);
  const date = mtime || new Date(mtimeMs);

  const src = url.match(/^file:\/\//) ? url.substr(7) : false;

  return {sha1sum, size, url, src, filename, type, date, files: [], meta: {}, sidecars: []};
})

module.exports = mapToStorageEntry