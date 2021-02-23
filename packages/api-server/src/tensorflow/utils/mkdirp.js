const fs = require('fs').promises;
const path = require('path');

const mkdirp = async (dir) => {
  return fs.access(dir)
    .catch(() => {
      return mkdirp(path.dirname(dir))
        .then(() => fs.mkdir(dir))
    })
}

module.exports = mkdirp;
