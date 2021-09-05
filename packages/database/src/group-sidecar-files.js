const path = require('path');
const through2 = require('through2');

const bySize = (a, b) => a.size < b.size ? 1 : -1

const byFilename = (a, b) => a.filename < b.filename ? -1 : 1

function toPrimaryEntry(entries) {
  const primary = entries[0]
  if (entries.length > 1) {
    primary.sidecars = entries.slice(1);
  }

  return primary;
}

/**
 * Strip one or two extensions to group files with their sidecars, sorted by their size
 * The main file will be the largest one
 *
 * Example: IMG_2635.AVI, IMG_2635.THM, IMG_2635.AVI.xmp -> group(IMG_2635)
 */
const sidecarFiles = through2.obj(function (entries, enc, cb) {
  const sidecars = {}

  entries.sort(bySize).forEach(entry => {
    const { name, ext } = path.parse(entry.filename)
    const { name: name2, ext: ext2 } = path.parse(name)
    if (ext && sidecars[name]) {
      sidecars[name].push(entry)
    } else if (ext2 && sidecars[name2]) {
      sidecars[name2].push(entry)
    } else if (ext) {
      sidecars[name] = [entry]
    } else {
      sidecars[entry.filename] = [entry]
    }
  })

  const sidecarEntries = Object.values(sidecars).map(toPrimaryEntry);
  this.push(sidecarEntries.sort(byFilename));

  cb()
});

module.exports = sidecarFiles;