const through2 = require('through2');

function toPrimaryEntry(entries) {
  entries.sort((a, b) => a.size < b.size ? 1 : -1); 

  const primary = entries.shift();
  primary.sidecars = entries;
  return primary;
}

/**
 * Strip up to two extensions to group files with their sidecars
 * 
 * Example: IMG_2635.AVI, IMG_2635.THM, IMG_2635.AVI.xmp -> group(IMG_2635)
 */
const sidecarFiles = through2.obj(function (entries, enc, cb) {
  let result = [];

  const sidecars = {}

  function addSidecar(entry, name) {
    if (sidecars[name]) {
      sidecars[name].push(entry);
    } else {
      sidecars[name] = [entry];
    }
  }
  
  entries.forEach(entry => {
    const extMatch1 = entry.filename.match(/(.*)(\.\w{2,4})$/);
    const extMatch2 = extMatch1 && extMatch1[1].match(/(.*)(\.\w{2,4})$/);
    if (extMatch2) {
      addSidecar(entry, extMatch2[1]);
    } else if (extMatch1) {
      addSidecar(entry, extMatch1[1]);
    } else {
      result.push(entry);
    }
  })

  result = result.concat(Object.values(sidecars).map(toPrimaryEntry));
  this.push(result);

  cb()
});

module.exports = sidecarFiles;