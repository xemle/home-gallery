const through2 = require('through2')

const { sidecars } = require('@home-gallery/common')
const { groupSidecarFiles, ungroupSidecarFiles } = sidecars

const groupSidecars = () => through2.obj(function (entries, enc, cb) {
  this.push(groupSidecarFiles(entries))

  cb()
})

const ungroupSidecars = () => through2.obj(function (entry, enc, cb) {
  const entries = ungroupSidecarFiles(entry)
  for (let e of entries) {
    this.push(e)
  }

  cb()
})

module.exports = {
  groupSidecars,
  ungroupSidecars
}