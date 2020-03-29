const path = require('path');

function getStoragePaths(sha1sum) {
  const dir = path.join(sha1sum.substr(0, 2), sha1sum.substr(2, 2));
  return {
    dir,
    prefix: sha1sum.substr(4)
  }
}

module.exports = getStoragePaths;