const fs = require('fs');
const path = require('path');
const { writeJsonGzip } = require('@home-gallery/common');

const rename = (from, to, index, cb) => {
  fs.rename(from, to, (err) => {
    if (err) {
      cb(err);
    } else {
      cb(null, index);
    }
  });
}

/**
 * Sorts directory descending and filename ascending
 *
 * This ensures:
 *
 * 1) Directory first
 * 2) Latest folers first for common year bases media directories
 * 3) Standard ascending file order in folders, where videos come last
 *
 * Example:
 *  2021
 *  2021/2021-12-24
 *  2021/2021-12-24/IMG_2034.jpg
 *  2021/2021-12-24/IMG_2035.jpg
 *  2021/2021-08-10
 *  2021/2021-08-10/IMG_1478.jpg
 *  2021/2021-08-10/VID_1479.jpg
 *  2020
 *  2020/2020-09-20
 */
const byDirDescFileAsc = (a, b) => {
  const dirA = path.dirname(a)
  const dirB = path.dirname(b)

  if (dirA == dirB) {
    return path.basename(a) < path.basename(b) ? -1 : 1;
  } else if (b.startsWith(a)) {
    return -1;
  } else if (a.startsWith(b)) {
    return 1;
  } else {
    return a < b ? 1 : -1;
  }
}

const mapSortValueFor = (mapFn, sortFn) => (a, b) => sortFn(mapFn(a), mapFn(b));

const writeIndex = (filename, index, cb) => {
  index.created = new Date().toISOString();
  index.data.sort(mapSortValueFor(e => e.filename, byDirDescFileAsc));
  const tmp = `${filename}.tmp`;
  writeJsonGzip(tmp, index, (err) => {
    if (err) {
      cb(err);
    } else {
      rename(tmp, filename, index, cb);
    }
  });
}

module.exports = writeIndex;
