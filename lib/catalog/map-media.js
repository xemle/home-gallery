const through2 = require('through2');

const mapMedia = through2.obj(function (entry, enc, cb) {
  const allStorageFiles = [entry.files]
    .concat(entry.sidecars.map(sidecar => sidecar.files))
    .reduce((r, a) => { a.forEach(v => r.push(v)); return r});

  const mapFile = ({sha1sum, type, size, filename}) => { return { id: sha1sum, type, size, filename }; }

  const media = {
    id: entry.sha1sum,
    type: entry.type,
    date: entry.date,
    files: [mapFile(entry)].concat(entry.sidecars.map(mapFile)),
    previews: allStorageFiles.filter(file => file.match(/-preview/))
  }

  this.push(media);
  cb();
});

module.exports = mapMedia;