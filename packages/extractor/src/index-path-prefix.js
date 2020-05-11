const path = require('path');

const getIndexPathPrefix = (entry) => {
  const pathNames = entry.filename.split(path.sep);
  const prefixLen = Math.min(2, pathNames.length - 1);
  return `${entry.indexName}:${pathNames.slice(0, prefixLen).join(path.sep)}`;
}

module.exports = { getIndexPathPrefix };

