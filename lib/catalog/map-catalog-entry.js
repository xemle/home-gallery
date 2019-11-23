const map = require('./map');
const { getFileTypeByExtension } = require('../utils/file-types');

const mapToCatalogEntry = map(({sha1sum, size, mtime, mtimeMs, base, filename}) => {
  const type = getFileTypeByExtension(filename);
  const date = mtime || new Date(mtimeMs);

  return Object.assign({}, {sha1sum, size, base, filename, type, date, files: [], meta: {}, sidecars: []})
})

module.exports = mapToCatalogEntry