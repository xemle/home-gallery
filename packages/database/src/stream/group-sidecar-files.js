const { through } = require('@home-gallery/stream')
const { sidecars } = require('@home-gallery/common')
const { groupSidecarFiles } = sidecars

const sidecarFiles = through(function (entries, enc, cb) {
  this.push(groupSidecarFiles(entries))

  cb()
});

module.exports = sidecarFiles;