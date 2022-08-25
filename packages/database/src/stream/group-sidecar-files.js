const through2 = require('through2')

const { sidecars } = require('@home-gallery/common')
const { groupSidecarFiles } = sidecars

const sidecarFiles = through2.obj(function (entries, enc, cb) {
  this.push(groupSidecarFiles(entries))

  cb()
});

module.exports = sidecarFiles;