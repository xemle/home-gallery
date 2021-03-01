const through2 = require('through2');

const bySize = (a, b) => a.size < b.size ? 1 : -1

function toPrimaryEntry(entries) {
  entries.sort(bySize);

  const primary = entries.shift();
  primary.sidecars = entries;
  return primary;
}

/**
 * Strip one or two extensions to group files with their sidecars, sorted by their size
 * The main file will be the largest one
 *
 * Example: IMG_2635.AVI, IMG_2635.THM, IMG_2635.AVI.xmp -> group(IMG_2635)
 */
const sidecarFiles = through2.obj(function (entries, enc, cb) {
  let result = [];

  const sidecars = {}

  function addSidecar(entry, basename) {
    if (sidecars[basename]) {
      sidecars[basename].push(entry);
    } else {
      sidecars[basename] = [entry];
    }
  }

  entries.forEach(entry => {
    const filename = entry.filename;
    const extension = filename.match(/(\.\w{2,4}){1,2}$/);
    if (extension) {
      const basename = filename.substr(0, filename.length - extension[0].length)
      addSidecar(entry, basename);
    } else {
      result.push(entry);
    }
  })

  const sidecarEntries = Object.values(sidecars).map(toPrimaryEntry);
  this.push(result.concat(sidecarEntries));

  cb()
});

module.exports = sidecarFiles;