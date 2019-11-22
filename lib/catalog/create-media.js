const through2 = require('through2');
const { getFileTypeByExtension } = require('../utils/file-types');

const createMedia = (targetTypes) => {
  return through2.obj(function (media, enc, cb) {
    const {primary, sidecars} = media;
    const type = getFileTypeByExtension(primary.filename);
    if (targetTypes.indexOf(type) >= 0) {
      const all = [primary].concat(sidecars);
      const media = {
        id: primary.sha1sum,
        type,
        size: primary.size,
        files: [primary.filename].concat(sidecars.map(sidecar => sidecar.filename)),
        previews: all.map(entry => entry.files.filter(file => file.match(/-preview/))).reduce((r, v) => r.concat(v), [])
      };
      this.push(media);
    }
    cb();
  });
}

module.exports = createMedia;